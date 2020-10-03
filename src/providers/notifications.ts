import { AppNextWatch } from '../handlers/watch'
import { Errors, error } from '../handlers/error'
import { AppNextDataEvents, AppNextDataEventsListeners } from '../handlers/data'
import { AppNextServiceWorker } from '../handlers/worker'

export class AppNextNotificationsProvider extends AppNextWatch<Notification>
{
    constructor(worker: AppNextServiceWorker)
    {
        super('notifications')

        this.active = false
        this.registry = {}

        worker.onMessage(event =>
        {
            const message = event.data

            switch (message.source)
            {
                case 'notification':

                    const id = message.data, 
                          registry = this.registry[id]
                    
                    if (!id || !registry) return
                    
                    switch(message.event)
                    {
                        case 'click':
                            registry.events.invokeDataEvent(registry.notification)
                            this.query(id).catch(() => registry.events.invokeCancelEvent(error(Errors.featureTerminated)))
                            break
                    }
            }
        })
        worker.onReady(registration => this.registration = registration)
    }

    private active: boolean
    private registration: ServiceWorkerRegistration
    private readonly registry: Record<string, { events: AppNextDataEvents<Notification>, notification: Notification }>

    private query(tag: string) : Promise<Notification>
    {
        if (!this.registration) return Promise.reject()

        return new Promise((resolve, reject) =>
        {
            this.registration.getNotifications({ tag }).then(notifications =>
            {
                const notification = notifications[0]

                notification ? resolve(notification) : reject()

            }).catch(reject)
        })
    }

    public create(title: string, listeners: AppNextDataEventsListeners<Notification>, options?: NotificationOptions) : void
    {
        if (!this.active || !this.registration) return

        const events = AppNextDataEvents.from(listeners),
              id = 'app-next-' + new Date().getTime().toString(36)

        events.invokePendingEvent()

        this.registration.showNotification(title, Object.assign(options, { tag: id }))

        this.query(id).then(notification =>
        {
            this.registry[id] = { events, notification }

            this.invokeDataEvent(notification)
            events.invokeReadyEvent()

        }).catch((error) => events.invokeCancelEvent(error))
    }

    public request() : Promise<void>
    {
        return new Promise((resolve, reject) =>
        {
            const handlePermission = (permission: NotificationPermission) => 
            {
                if (handling) return; handling = true
                
                const id = setInterval(() => 
                {
                    if (this.registration)
                    {
                        clearInterval(id); this.active = true

                        if (!this.permission.handle(permission))
                        {
                            this.active = false
                        }
                        
                        resolve()
                    }

                }, 100)
            }

            var handling = false
            const handler = Notification.requestPermission(handlePermission)

            if (handler instanceof Promise) 
            {
                handler.then(handlePermission).catch(error =>
                {
                    this.active = false
                    this.invokeErrorEvent(error)

                    reject(error)
                })
            }
        })
    }

    public start() : Promise<void>
    {
        return this.active ? Promise.reject() : this.request()
    }

    public stop() : boolean
    {
        if (!this.active) return false

        this.active = false

        try
        {
            const keys = Object.keys(this.registry),
                  count = keys.length

            keys.forEach(key => 
            {
                const registry = this.registry[key]

                try
                {
                    registry.notification.close()
                    registry.events.invokeCancelEvent(error(Errors.featureTerminated))
                }
                catch(error)
                {
                    registry.events.invokeErrorEvent(error)
                }
            })

            for (let i = 0; i < count; i++)
            {
                delete this.registry[keys[i]]
            }

            this.invokeCancelEvent(error(Errors.featureTerminated))

            return true
        }
        catch(error)
        {
            this.invokeErrorEvent(error); return false
        }
    }
}
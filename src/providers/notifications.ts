import { AppNextWatch } from '../handlers/watch'
import { Errors, error } from '../handlers/error'
import { AppNextDataEvents, AppNextDataEventsListeners } from '../handlers/data'
import { AppNextServiceWorker } from '../handlers/worker'

interface AppNextNotificationEvent
{
    action: string
    id: string
}

export class AppNextNotificationsProvider extends AppNextWatch<Notification>
{
    constructor(worker: AppNextServiceWorker)
    {
        super('notifications')

        this.active = false
        this.registry = {}

        worker.subscribe(event =>
        {
            const message = event.data

            switch (message.source)
            {
                case 'notification':

                    const close = () =>
                          {
                            delete this.registry[event.id]

                            registry.events.invokeCancelEvent(error(Errors.featureTerminated))
                          },
                          event = message.event as AppNextNotificationEvent

                    if (!event) return

                    const registry = this.registry[event.id]
                    
                    if (!event.id || !registry) return
                    
                    switch (message.on)
                    {
                        case 'click':
                            registry.events.invokeDataEvent(event)
                            this.query(event.id).catch(() => close())
                            break

                        case 'close':
                            close()
                            break
                    }
            }
        })

        this.worker = worker
    }

    private active: boolean
    private readonly registry: Record<string, { events: AppNextDataEvents<AppNextNotificationEvent>, notification: Notification }>
    private readonly worker: AppNextServiceWorker

    private query(tag: string) : Promise<Notification>
    {
        return new Promise((resolve, reject) =>
        {
            const error = this.worker.invoke(registration =>
            {
                registration.getNotifications({ tag }).then(notifications =>
                {
                    const notification = notifications[0]
    
                    notification ? resolve(notification) : reject()
    
                }).catch(reject)
            })

            if (error) reject(error)
        })
    }

    public create(title: string, listeners: AppNextDataEventsListeners<AppNextNotificationEvent>, options?: NotificationOptions) : void
    {
        if (!this.active) return

        const events = AppNextDataEvents.from(listeners),
              id = 'app-next-' + new Date().getTime().toString(36)

        events.invokePendingEvent()

        this.worker.invoke(registration =>
        {
            registration.showNotification(title, Object.assign(options, { tag: id }))
                        .then(() => this.query(id))
                        .then(notification =>
                        {
                            this.registry[id] = { events, notification }

                            this.invokeDataEvent(notification)
                            events.invokeReadyEvent()

                        }).catch((error) => events.invokeCancelEvent(error))
        })
    }

    public request() : Promise<void>
    {
        return new Promise((resolve, reject) =>
        {
            const handlePermission = (permission: NotificationPermission) => 
            {
                if (handling) return; handling = true

                this.active = true

                if (!this.permission.handle(permission))
                {
                    this.active = false
                }

                resolve()
            }

            var handling = false; const handler = Notification.requestPermission(handlePermission)

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
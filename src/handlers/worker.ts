import { AppNextDataEvents } from './data'
import { error, Errors } from './error'

export class AppNextServiceWorker extends AppNextDataEvents<ServiceWorkerRegistration> implements Cycleable
{
    constructor()
    {
        super()

        this.listeners =
        {
            message: []
        }
    }

    private readonly listeners: 
    {
        message: Array<(event: MessageEvent) => void>
    }

    private channel: BroadcastChannel
    private registration: ServiceWorkerRegistration

    public invoke(handler: (registration: ServiceWorkerRegistration) => void) : Error
    {
        try
        {
            if (handler) handler(this.registration)
        }
        catch (error)
        {
            this.invokeErrorEvent(error)

            return error
        }
    }

    public message(data: any) : boolean
    {
        try
        {
            this.channel.postMessage(data)

            return true
        }
        catch(error)
        {
            this.invokeErrorEvent(error)

            return false
        }
    }

    public onMessage(listener: (event: MessageEvent) => void) : void
    {
        this.listeners.message.push(listener)
    }

    public start() : Promise<void>
    {
        if (this.registration) return Promise.reject()
        
        const invoke = (listeners: Array<Function>, handler: any) : void =>
        {
            listeners.forEach(listener =>
            {
                try
                {
                    listener.call({}, handler)
                }
                catch(error)
                {
                    this.invokeErrorEvent(error)
                }
            })
        }

        this.invokePendingEvent()

        try
        {
            this.channel = new BroadcastChannel('app-next-channel')
            this.channel.addEventListener('message', event => invoke(this.listeners.message, event))

            navigator.serviceWorker.register('/app-next-service-worker.js')
            
            return navigator.serviceWorker.ready.then(registration => 
            {
                this.invokeReadyEvent()
                this.invokeDataEvent(this.registration = registration)
    
            }).catch(error => this.invokeCancelEvent(error))
        }
        catch(error)
        {
            this.invokeCancelEvent(error)
        }  
    }

    public stop() : Promise<void>
    {
        const handleError = (error?: Error) : Promise<void> =>
        {
            if (error) this.invokeErrorEvent(error)

            return Promise.reject()
        }

        if (!this.registration) return handleError()

        return this.registration.unregister().then(success =>
        {
            if (success)
            {
                try
                {
                    this.channel.close()

                    this.invokeCancelEvent(error(Errors.featureTerminated))
    
                    return Promise.resolve()
                }
                catch(error)
                {
                    return handleError(error)
                }
            }

            return handleError()
        })
    }
}
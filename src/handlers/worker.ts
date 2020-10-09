import { AppNextDataEvents } from './data'
import { error, Errors } from './error'
import { AppNextPubSubManager } from './pubsub'

export class AppNextServiceWorker extends AppNextDataEvents<ServiceWorkerRegistration> implements Cycleable
{
    constructor()
    {
        super()

        this.pubsub = new AppNextPubSubManager()
    }


    private pubsub: AppNextPubSubManager
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

    public subscribe(listener: (event: MessageEvent) => void) : void
    {
        this.pubsub.subscribe(listener)
    }

    public start() : Promise<void>
    {
        if (this.registration) return Promise.reject()
        
        this.invokePendingEvent()

        try
        {
            navigator.serviceWorker.onmessage = event => this.pubsub.invoke(event)
            navigator.serviceWorker.register('/app-next-service-worker.js')

            return navigator.serviceWorker.ready.then(registration => 
            {
                this.registration = registration

                return registration.update()

            }).then(() =>
            {
                this.invokeReadyEvent()
                this.invokeDataEvent(this.registration)

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
                this.invokeCancelEvent(error(Errors.featureTerminated))
    
                return Promise.resolve()
            }

            return handleError()
        })
    }
}
export class AppNextServiceWorker
{
    constructor()
    {
        this.listeners =
        {
            message: [],
            ready: []
        }
    }

    private readonly listeners: 
    {
        message: Array<(event: MessageEvent) => void>,
        ready: Array<(registration: ServiceWorkerRegistration) => void>
    }

    public onMessage(listener: (event: MessageEvent) => void)
    {
        this.listeners.message.push(listener)
    }

    public onReady(listener: (registration: ServiceWorkerRegistration) => void)
    {
        this.listeners.ready.push(listener)
    }

    public apply()
    {
        function invoke(listeners: Array<Function>, handler: any) : void
        {
            listeners.forEach(listener =>
            {
                try
                {
                    listener.call({}, handler)
                }
                catch(error)
                {
                    console.error(error)
                }
            })
        }

        navigator.serviceWorker.register('/app-next-service-worker.js')

        const channel = new BroadcastChannel('app-next-channel')
        
        channel.addEventListener('message', event => invoke(this.listeners.message, event))

        //navigator.serviceWorker.addEventListener('message', event => invoke(this.listeners.message, event))

        navigator.serviceWorker.ready.then(registration => invoke(this.listeners.ready, registration))
    }
}
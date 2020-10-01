import { AppNextDataEvents } from './data'
import { error, Errors } from './error'
import { AppNextWatcher } from './watch'

export class AppNextBackgroundService extends AppNextDataEvents<MessageEvent> implements AppNextWatcher
{
    constructor(script: string)
    {
        super()

        this.code = 'data:application/x-javascript;base64,' + btoa(script)
    }

    private readonly code : string
    private worker: Worker

    public request()
    {
        try
        {
            if (this.worker) return

            this.worker = new Worker(this.code)

            this.invokePendingEvent()
        }
        catch(error)
        {
            this.invokeCancelEvent(error)
        }
    }

    public send(data: any) : void
    {
        this.worker.postMessage(data)
    }

    public start() : void
    {
        if (!this.worker)
        {
            this.request()

            if (!this.worker) return
        }

        this.worker.onerror = event => this.invokeErrorEvent(event.error)

        this.worker.onmessage = event =>
        {
            try
            {
                this.invokeDataEvent(event)
            }
            catch(error)
            {
                this.invokeErrorEvent(error)
            }
        }

        this.invokeReadyEvent()
    }

    public stop(data?: any) : void
    {
        try
        {
            if (arguments.length == 1) this.send(data)

            setTimeout(() => 
            {
                this.worker.terminate()
                this.worker.onerror = this.worker.onmessage = null
            
                this.invokeCancelEvent(error(Errors.featureTerminated))

            }, 10) 
        }
        catch(error)
        {
            this.invokeErrorEvent(error)
        }
    }

    
}
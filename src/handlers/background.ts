import { AppNextDataEvents } from './data'
import { error, Errors } from './error'
import { AppNextWatcher } from './watch'

export class AppNextBackgroundService extends AppNextDataEvents<MessageEvent> implements AppNextWatcher, Cycleable
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

    public post(data: any) : void
    {
        this.worker.postMessage(data)
    }

    public start() : boolean
    {
        if (!this.worker)
        {
            this.request()

            if (!this.worker) return false
        }

        try
        {
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
    
            this.invokeReadyEvent(); return true
        }
        catch(error)
        {
            this.invokeCancelEvent(error)

            return false
        }
    }

    public stop(data?: any) : Promise<void>
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                if (arguments.length == 1) this.post(data)
    
                setTimeout(() => 
                {
                    this.worker.terminate()
                    this.worker.onerror = this.worker.onmessage = null
                
                    this.invokeCancelEvent(error(Errors.featureTerminated))
    
                    resolve()
    
                }, 10) 
            }
            catch(error)
            {
                this.invokeErrorEvent(error); reject()
            }
        })
        
    }

    
}
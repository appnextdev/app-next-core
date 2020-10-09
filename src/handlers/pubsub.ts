import { AppNextDataEvents } from './data'

export class AppNextPubSubManager extends AppNextDataEvents<any>
{
    constructor(post?: (message: any) => boolean)
    {
        super()

        this.listeners = []
    }

    private readonly listeners: Array<(event: MessageEvent) => void>
    
    public invoke(event: MessageEvent) : void
    {
        this.listeners.forEach(listener =>
        {
            try
            {
                listener.call({}, event)
            }
            catch(error)
            {
                this.invokeErrorEvent(error)
            }
        })
    }

    public subscribe(listener: (event: MessageEvent) => void) : void
    {
        this.listeners.push(listener)
    }

    public reset() : void
    {
        this.listeners.splice(0, this.listeners.length)
    }
}
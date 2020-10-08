import { AppNextDataEvents } from './data'

export class AppNextPubSubManager extends AppNextDataEvents<any>
{
    constructor(post: (message: any) => boolean)
    {
        super()

        this.listeners = []
        this.post = post
    }

    private readonly listeners: Array<(event: MessageEvent) => void>
    private readonly post: (message: any) => boolean

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

    public publish(message: any) : boolean
    {
        return this.post ? this.post(message) : false
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
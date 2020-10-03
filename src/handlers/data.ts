export interface AppNextDataEventsListeners<T>
{
    onCancel?(error: Error) : void
    onData?(data: T) : void
    onError(error: Error) : void
    onPending?() : void
    onReady() : void
}

export class AppNextDataEvents<T>
{
    public static from<T>(listeners: AppNextDataEventsListeners<T>) : AppNextDataEvents<T>
    {
        const handler = new AppNextDataEvents<T>()

        handler.onCancel = listeners.onCancel
        handler.onData = listeners.onData
        handler.onError = listeners.onError
        handler.onPending = listeners.onPending
        handler.onReady = listeners.onReady

        return handler
    }

    constructor()
    {
        this.waiting = false
    }

    private cancel: (error: Error) => void
    private data: (data: T) => void
    private error: (error: Error) => void
    private pending: () => void
    private ready: () => void

    private waiting: boolean

    public set onCancel(listener: (error: Error) => void) { this.cancel = listener }
    public set onData(listener: (data: T) => void) { this.data = listener }
    public set onError(listener: (error: Error) => void) { this.error = listener }
    public set onPending(listener: () => void) { this.pending = listener }
    public set onReady(listener: () => void) { this.ready = listener }

    public invokeCancelEvent(error: Error)
    {
        try
        {
            if (this.cancel) this.cancel(error)
        }
        catch (error)
        {
            this.invokeErrorEvent(error)
        }
    }

    public invokeDataEvent(data: T)
    {
        try
        {
            if (this.data) this.data(data)
        }
        catch (error)
        {
            this.invokeErrorEvent(error)
        }
    }

    public invokeErrorEvent(error: Error)
    {
        if (this.error) this.error(error)
    }

    public invokePendingEvent()
    {
        try
        {
            this.waiting = true

            if (this.pending) this.pending()
        }
        catch (error)
        {
            this.invokeErrorEvent(error)
        }
    }

    public invokeReadyEvent()
    {
        try
        {
            if (!this.waiting) this.invokePendingEvent()
            
            if (this.ready) this.ready()
        }
        catch (error)
        {
            this.invokeErrorEvent(error)
        }
    }
}
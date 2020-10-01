export interface AppNextDataEventsListeners<T>
{
    oncancel?(error: Error) : void
    ondata?(data: T) : void
    onerror(error: Error) : void
    onpending?() : void
    onready() : void
}

export class AppNextDataEvents<T>
{
    private cancel: (error: Error) => void
    private data: (data: T) => void
    private error: (error: Error) => void
    private pending: () => void
    private ready: () => void

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
            if (this.ready) this.ready()
        }
        catch (error)
        {
            this.invokeErrorEvent(error)
        }
    }
}
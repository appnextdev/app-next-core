import { AppNextWatch } from '../../handlers/watch'
import { Errors, error } from '../../handlers/error'

export abstract class AppNextSensor<T extends Sensor> extends AppNextWatch<T>
{
    constructor(factory: () => T, permissions: Array<PermissionName> | PermissionName)
    {
        super(permissions)

        this.factory = factory
    }

    private factory: () => T
    protected handler: T

    private initiate() : void
    {
        if (this.factory)
        {
            this.invokePendingEvent()

            try
            {
                this.handler = this.factory()
            }
            catch (error)
            {
                switch (error.name)
                {
                    case 'SecurityError':
                    case 'ReferenceError':
                        this.invokeCancelEvent(error)
                        break

                    default:
                        this.invokeErrorEvent(error)
                }
            }
        }
        else
        {
            this.invokeErrorEvent( error(Errors.invalidFactoryFunction))
        }
    }

    public start() : boolean
    {
        if (!this.handler)
        {
            this.initiate(); if (!this.handler) return false

            this.handler.onerror = event =>
            {
                switch (event.error.name)
                {
                    case 'NotAllowedError':
                    case 'NotReadableError': 
                        return this.invokeCancelEvent(event.error)

                    default: 
                        return this.invokeErrorEvent(event.error)
                }
            }

            this.handler.onreading = () => this.invokeDataEvent(this.handler)
        }

        try
        {
            this.handler.start()
            this.invokeReadyEvent()

            return true
        }
        catch(error)
        {
            this.invokeCancelEvent(error)

            return false
        }
    }

    public stop() : boolean
    {
        if (this.handler) 
        {
            this.handler.stop()
            
            this.invokeCancelEvent(error(Errors.featureTerminated))

            return true
        }

        return false
    }
}
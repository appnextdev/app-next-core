import { AppNextWatch } from '../handlers/watch'
import { Errors, error } from '../handlers/error'

export abstract class AppNextSensor<T extends Sensor> extends AppNextWatch<T>
{
    constructor(factory: () => T, permissions: Array<PermissionName> | PermissionName)
    {
        super(permissions)

        this.factory = factory
    }

    private factory: () => T
    protected handler: T

    public request() : Promise<void>
    {
        if (!this.factory) return Promise.reject(error(Errors.invalidFactoryFunction))

        this.invokePendingEvent()

        return super.request().then(() => 
        {
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
                        return this.invokeCancelEvent(error)

                    default:
                        this.invokeErrorEvent(error)
                }
            }
        }).catch(error => this.invokeErrorEvent(error))
    }

    public start() : void
    {
        if (!this.handler) return

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

        this.handler.start(); this.invokeReadyEvent()
    }

    public stop()
    {
        if (this.handler) 
        {
            this.handler.stop(); this.invokeCancelEvent(error(Errors.featureTerminated))
        }
    }
}
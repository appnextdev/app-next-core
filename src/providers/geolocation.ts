import { AppNextPermissionProvider } from './permission'
import { AppNextWatch } from '../handlers/watch'
import { Errors, error } from '../handlers/error'

export class AppNextGeoLocationProvider extends AppNextWatch<Position>
{
    constructor(options: PositionOptions)
    {
        super()

        this.options = options
        this.permission = new AppNextPermissionProvider('geolocation')

        this.permission.onCancel = error => this.invokeCancelEvent(error)
        this.permission.onError = error => this.invokeErrorEvent(error)
        this.permission.onPending = () => this.invokePendingEvent()
    }

    private readonly options: PositionOptions
    private readonly permission: AppNextPermissionProvider

    public request() : Promise<void> 
    {
        return this.permission.register()
    }

    public start() : void 
    {
        var init = true

        this.id = navigator.geolocation.watchPosition(position =>
        {
            if (init)
            {
                init = false; this.invokeReadyEvent()
            }

            this.invokeDataEvent(position)

        }, error =>
        {
            if (init)
            {
                this.invokeCancelEvent(new Error(error.message))
            }
            else
            {
                this.invokeErrorEvent(new Error(error.message))
            }
            
        }, this.options || {})
    }

    public stop() : void 
    {
        try
        {
            if (!this.id) return
            
            navigator.geolocation.clearWatch(this.id); this.id = null

            this.invokeCancelEvent(error(Errors.featureTerminated))
        }
        catch (error)
        {
            this.invokeErrorEvent(error)
        }
    }
}
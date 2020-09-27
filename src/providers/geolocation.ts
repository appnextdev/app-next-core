import { AppNextWatch } from '../handlers/watch'
import { Errors, error } from '../handlers/error'

export class AppNextGeoLocationProvider extends AppNextWatch<Position>
{
    constructor(options?: PositionOptions)
    {
        super('geolocation')

        this.options = options
    }

    private id: number
    private readonly options: PositionOptions

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
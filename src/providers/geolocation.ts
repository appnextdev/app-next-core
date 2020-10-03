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

    public start() : Promise<void> 
    {
        return new Promise((resolve, reject) =>
        {
            var init = true

            this.id = navigator.geolocation.watchPosition(position =>
            {
                if (init)
                {
                    init = false; this.invokeReadyEvent()
                }
    
                this.invokeDataEvent(position); resolve()
    
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

                reject()
                
            }, this.options || {})
        })
    }

    public stop() : boolean 
    {
        if (!this.id) return false

        try
        {
            navigator.geolocation.clearWatch(this.id); this.id = null

            this.invokeCancelEvent(error(Errors.featureTerminated))

            return true
        }
        catch (error)
        {
            this.invokeErrorEvent(error); return false
        }
    }
}
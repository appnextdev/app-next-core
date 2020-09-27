import { AppNextGeoLocationProvider } from './providers/geolocation'
import { AppNextAccelerometer } from './sensors/accelerometer'

interface AppNextCoreProviders
{
    geolocation: (options?: PositionOptions) => AppNextGeoLocationProvider
}

interface AppNextCoreSensors
{
    accelerometer: (options?: AccelerometerSensorOptions) => AppNextAccelerometer
}

export function config(name: string)
{
    return (AppNextCore.config || {})[name] || {}
}

export class AppNextCore
{
    public static config: any

    constructor()
    {
        this.providers = 
        {
            geolocation: (options?: PositionOptions) => new AppNextGeoLocationProvider(options)
        }

        this.sensors = 
        {
            accelerometer: (options?: AccelerometerSensorOptions) => new AppNextAccelerometer(options)
        }
    }

    public readonly providers: AppNextCoreProviders
    public readonly sensors: AppNextCoreSensors

    public config(value: any) { AppNextCore.config = value || {} }
}
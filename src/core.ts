import { AppNextGeoLocationProvider } from './providers/geolocation'
import { AppNextAccelerometer } from './sensors/accelerometer'
import { AppNextNotificationsProvider } from './providers/notifications'

interface AppNextCoreProviders
{
    geolocation: (options?: PositionOptions) => AppNextGeoLocationProvider
    notifications: () => AppNextNotificationsProvider
}

interface AppNextCoreSensors
{
    accelerometer: (options?: AccelerometerSensorOptions) => AppNextAccelerometer
}

export function config(name: string)
{
    const object = (AppNextCore.config || {})[name] || {}

    object.name = name; return object
}

export class AppNextCore
{
    public static config: any

    constructor()
    {
        this.providers = 
        {
            geolocation: (options?: PositionOptions) => new AppNextGeoLocationProvider(options),
            notifications: () => new AppNextNotificationsProvider()
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
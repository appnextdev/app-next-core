import { AppNextAccelerometerSensor } from './sensors/accelerometer'
import { AppNextGeoLocationProvider } from './providers/geolocation'
import { AppNextGyroscopeSensor } from './sensors/gyroscope'
import { AppNextLightSensor } from './sensors/light'
import { AppNextMagnetometerSensor } from './sensors/magnetometer'
import { AppNextNotificationsProvider } from './providers/notifications'
import { AppNextServiceWorker } from './handlers/worker'
import { AppNextDataEvents, AppNextDataEventsListeners } from './handlers/data'
import { error, Errors } from './handlers/error'

interface AppNextCoreProviders
{
    geolocation: (options?: PositionOptions) => AppNextGeoLocationProvider
    notifications: () => AppNextNotificationsProvider
}

interface AppNextCoreSensors
{
    accelerometer: (options?: AccelerometerSensorOptions) => AppNextAccelerometerSensor
    gyroscope: (options?: SensorOptions) => AppNextGyroscopeSensor
    light: (options?: SensorOptions) => AppNextLightSensor
    magnetometer: (options?: SensorOptions) => AppNextMagnetometerSensor
}

export function config(name: string)
{
    const object = (AppNextCore.config || {})[name] || {}

    object.name = name; return object
}

export class AppNextCore extends AppNextDataEvents<AppNextCore> implements Cycleable
{
    public static config: any

    constructor(events: AppNextDataEventsListeners<AppNextCore>)
    {
        super()

        this.onCancel = events.onCancel
        this.onData = events.onData
        this.onError = events.onError
        this.onPending = events.onPending
        this.onReady = events.onReady

        this.providers = 
        {
            geolocation: null,
            notifications: null
        }

        this.sensors = 
        {
            accelerometer: null,
            gyroscope: null,
            light: null,
            magnetometer: null
        }

        this.worker = new AppNextServiceWorker()
        this.worker.onError = this.onError
    }

    private worker: AppNextServiceWorker

    public readonly providers: AppNextCoreProviders
    public readonly sensors: AppNextCoreSensors

    public config(value: any) { AppNextCore.config = value || {} }

    public publish(data: any) : boolean
    {
        return this.worker.message(data)
    }

    public subscribe(listener: (event: MessageEvent) => void) : void
    {
        this.worker.onMessage(listener)
    }

    public start() : Promise<void>
    {
        try
        {
            const handle =
            {
                notifications: null as AppNextNotificationsProvider
            }

            this.worker.onReady = () => 
            {
                this.providers.geolocation = (options?: PositionOptions) => new AppNextGeoLocationProvider(options)
                this.providers.notifications = () => 
                {
                    if (!handle.notifications)
                    {
                        handle.notifications = new AppNextNotificationsProvider(this.worker)
                    }

                    return handle.notifications
                }
                this.sensors.accelerometer = (options?: AccelerometerSensorOptions) => new AppNextAccelerometerSensor(options)
                this.sensors.gyroscope = (options?: SensorOptions) => new AppNextGyroscopeSensor(options)
                this.sensors.light = (options?: SensorOptions) => new AppNextLightSensor(options)
                this.sensors.magnetometer = (options?: SensorOptions) => new AppNextMagnetometerSensor(options)
            }

            return this.worker.start().then(() => 
            {
                this.invokeReadyEvent()
                this.invokeDataEvent(this)
                
            }).catch(error => this.invokeCancelEvent(error))
        }
        catch(error)
        {
            this.invokeCancelEvent(error)

            return Promise.reject()
        }
    }

    public stop(): Promise<void>
    {
        const tasks =
        [
            this.worker.stop()
        ]

        return Promise.all(tasks).then(() => this.invokeCancelEvent(error(Errors.featureTerminated)))
    }
}
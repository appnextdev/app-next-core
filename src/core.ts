import { AppNextAccelerometerSensor } from './sensors/accelerometer'
import { AppNextGeoLocationProvider } from './providers/geolocation'
import { AppNextGyroscopeSensor } from './sensors/gyroscope'
import { AppNextLightSensor } from './sensors/light'
import { AppNextMagnetometerSensor } from './sensors/magnetometer'
import { AppNextNotificationsProvider } from './providers/notifications'
import { AppNextServiceWorker } from './handlers/worker'
import { AppNextDataEvents, AppNextDataEventsListeners } from './handlers/data'
import { error, Errors } from './handlers/error'
import { AppNextPubSubManager } from './handlers/pubsub'
import { AppNextBackgroundService } from './handlers/background'

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

        this.pubsub = new AppNextPubSubManager(message => this.service.post(message))
        this.service = new AppNextBackgroundService('/app-next-pubsub.js')
        this.service.onError = error => this.invokeErrorEvent(error)
        this.service.onData = event => 
        {
            const message = event.data

            if (message.error) 
            {
                this.invokeErrorEvent(event.data.error)
            }
            else
            {
                this.pubsub.invoke(event)
            }
        }
        this.worker = new AppNextServiceWorker()
    }

    private readonly pubsub: AppNextPubSubManager
    private readonly service: AppNextBackgroundService
    private readonly worker: AppNextServiceWorker

    public readonly providers: AppNextCoreProviders
    public readonly sensors: AppNextCoreSensors

    public config(value: any) { AppNextCore.config = value || {} }

    public publish(message: any, topic?: string) : boolean
    {
        if (!(message instanceof Object)) message = { message }

        return this.service.post(Object.assign(message, { topic }))
    }

    public subscribe(listener: (event: MessageEvent) => void, topic?: string) : void
    {
        this.pubsub.subscribe((event: MessageEvent) =>
        {
            if (topic == event.data.topic) listener(event)
        })
    }

    public start() : Promise<void>
    {
        const handle =
        {
            notifications: null as AppNextNotificationsProvider
        }

        this.service.onCancel = error => this.invokeCancelEvent(error)
        this.service.onError = error => this.invokeErrorEvent(error)
        this.worker.onCancel = error => this.invokeCancelEvent(error)
        this.worker.onError = error => this.invokeErrorEvent(error)

        this.service.onReady = () =>
        {
            this.invokeReadyEvent()
            this.invokeDataEvent(this)
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

        return this.worker.start().then(() => { this.service.start() })
                                  .catch(error => this.invokeCancelEvent(error))
    }

    public stop(): Promise<void>
    {
        const tasks =
        [
            this.service.stop(),
            this.worker.stop()
        ]

        return Promise.all(tasks)
                      .then(() => this.invokeCancelEvent(error(Errors.featureTerminated)))
                      .catch(error => this.invokeErrorEvent(error))
    }
}
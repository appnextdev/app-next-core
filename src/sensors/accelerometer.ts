import { AppNextSensor } from './base/sensor'

export class AppNextAccelerometer extends AppNextSensor<Accelerometer>
{
    constructor(options?: AccelerometerSensorOptions)
    {
        super(() => new Accelerometer(options), 'accelerometer')
    }
}
import { AppNextSensor } from './base/sensor'

export class AppNextAccelerometerSensor extends AppNextSensor<Accelerometer>
{
    constructor(options?: AccelerometerSensorOptions)
    {
        super(() => new Accelerometer(options), 'accelerometer')
    }
}
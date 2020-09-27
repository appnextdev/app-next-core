import { AppNextSensor } from './base'

export class AppNextAccelerometer extends AppNextSensor<Accelerometer>
{
    constructor(options?: AccelerometerSensorOptions)
    {
        super(() => new Accelerometer(options), 'accelerometer')
    }
}
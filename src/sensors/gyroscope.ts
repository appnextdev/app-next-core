import { AppNextSensor } from './base/sensor'

export class AppNextGyroscopeSensor extends AppNextSensor<Gyroscope>
{
    constructor(options?: SensorOptions)
    {
        super(() => new Gyroscope(options), 'gyroscope')
    }
}
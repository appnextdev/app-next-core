import { AppNextSensor } from './base/sensor'

export class AppNextMagnetometerSensor extends AppNextSensor<Magnetometer>
{
    constructor(options?: SensorOptions)
    {
        super(() => new Magnetometer(options), 'magnetometer')
    }
}
import { AppNextSensor } from './base/sensor'

export class AppNextLightSensor extends AppNextSensor<AmbientLightSensor>
{
    constructor(options?: SensorOptions)
    {
        super(() => new AmbientLightSensor(options), 'ambient-light-sensor')
    }
}
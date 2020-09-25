import { AppNextGeoLocationProvider } from './providers/geolocation'
//import { AppNextMediaPicker } from './elements/media-picker'

interface AppNextCoreProviders
{
    geolocation: any
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
            geolocation: (options: PositionOptions) => new AppNextGeoLocationProvider(options)
        }
    }

    public readonly providers: AppNextCoreProviders

    public config(value: any) { AppNextCore.config = value }
}
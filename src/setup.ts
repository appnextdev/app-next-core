import { AppNextBackgroundService } from './handlers/background'
import { AppNextFileSaver } from './elements/file-saver'
import { AppNextMediaPicker } from './elements/media-picker'
import { AppNextCustomElement } from './elements/base/element'

abstract class AppNextSetupRegistry<T>
{
    constructor()
    {
        this.registry = {}
    }

    public readonly registry: Record<string, T>

    protected exists(key: string) : boolean
    {
        return this.registry[key] ? true : false
    }

    protected update(key: string, value: T) : void
    {
        this.registry[key] = value
    }

    public abstract register(key: string, value: T) : T
}

class AppNextCustomElementsRegistry extends AppNextSetupRegistry<any>
{
    constructor()
    {
        super()

        this.register('file-saver', AppNextFileSaver)
        this.register('media-picker', AppNextMediaPicker)

        this.CustomElement = AppNextCustomElement
    }

    public readonly CustomElement: Function

    public register(name: string, ctor: any) : any
    {
        if (!customElements || this.exists(name)) return null

        customElements.define(name, ctor)

        this.update(name, ctor); return ctor
    }
}

class AppNextServicesRegistry extends AppNextSetupRegistry<AppNextBackgroundService>
{
    public register(path: string, worker: AppNextBackgroundService) : AppNextBackgroundService
    {
        if (!window.Worker || this.exists(path)) return null

        this.update(path, worker); return worker
    }
}

class AppNextRenderer
{
    public custom(elements: Array<string>) : void
    {
        elements.forEach(element => this.render(document.querySelectorAll(element)))
    }

    public render(elements: NodeListOf<Element> = document.querySelectorAll('*')) : void
    {
        elements.forEach((element: any) => 
        {
            if (element.render instanceof Function) element.render()
        })
    }
}

export class AppNextSetup
{
    constructor()
    {
        this.elements = new AppNextCustomElementsRegistry()     
        this.renderer = new AppNextRenderer()
        this.services = new AppNextServicesRegistry()

        addEventListener('load', () =>
        {
            this.renderer.custom(Object.keys(this.elements.registry))
        })
    }

    private readonly elements: AppNextCustomElementsRegistry
    private readonly renderer: AppNextRenderer
    private readonly services: AppNextServicesRegistry

    public register = 
    {
        element: (name: string, ctor: Function) : Function =>
        {
            return this.elements.register(name, ctor)
        },

        service: (name: string, script: string) : AppNextBackgroundService =>
        {
            return this.services.register(name, new AppNextBackgroundService(script))
        }
    }

    public render(elements: NodeListOf<Element>) : void
    {
        this.renderer.render(elements)
    }
}
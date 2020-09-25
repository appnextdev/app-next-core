import { AppNextMediaPicker } from './elements/media-picker'

class AppNextCustomElementsRegistry
{
    constructor()
    {
        this.registry = {}

        this.register('media-picker', AppNextMediaPicker)
    }

    public readonly registry: Record<string, Function>

    public register(name: string, ctor: any) : void
    {
        if (!customElements || this.registry[name]) return 

        customElements.define(name, ctor)

        this.registry[name] = ctor
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
        const elements = new AppNextCustomElementsRegistry()
              
        this.renderer = new AppNextRenderer()

        addEventListener('load', () =>
        {
            this.renderer.custom(Object.keys(elements.registry))
        })
    }

    private readonly renderer: AppNextRenderer

    public render(elements: NodeListOf<Element>) : void
    {
        this.renderer.render(elements)
    }
}
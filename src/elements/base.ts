import { config } from '../core'
import { AppNextDataEvents } from '../handlers/data'

class AppNextCustomElementUtils
{
    constructor(container: HTMLElement)
    {
        this.container = container
    }

    private readonly container: HTMLElement

    public attribute(name: string, value?: any) : any
    {
        switch (arguments.length)
        {
            case 1: return this.container.getAttribute(name)

            case 2: this.container.setAttribute(name, value)
        }
    }

    public config() : any
    {
        return config(this.attribute('config'))
    }

    public element(type: string) : HTMLElement
    {
        const element = document.createElement(type)

        this.container.attachShadow({ mode: 'open' })
        this.container.shadowRoot.append(element)

        return element
    }

    public reset() : void
    {
        this.container.innerHTML = ''
    }

    public support = 
    {
        attribute: (element: string, name: string) : boolean =>
        {
            const handler = document.createElement(element) as any

            handler.setAttribute(name, true)

            return !!handler[name]
        }
    }
}

export abstract class AppNextCustomElement<T> extends HTMLElement
{
    constructor()
    {
        super()

        this.events = new AppNextDataEvents<T>()
        this.utils = new AppNextCustomElementUtils(this)
    }

    protected readonly events: AppNextDataEvents<T>
    protected readonly utils: AppNextCustomElementUtils

    public abstract render() : void
}
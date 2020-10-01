import { config } from '../../core'

export class AppNextCustomElementUtils
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

            if (name in handler) return true

            handler.setAttribute(name, true)

            return !!handler[name]
        }
    }
}

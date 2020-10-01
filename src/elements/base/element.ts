import { AppNextCustomElementUtils } from './utils'
import { AppNextDataEvents } from '../../handlers/data'

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
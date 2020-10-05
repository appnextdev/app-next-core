declare interface Cycleable
{
    start(): boolean | Promise<void>
    stop(): boolean | Promise<void>
}

declare interface ExtendableEventInit extends EventInit
{

}

declare class ExtendableEvent extends Event 
{
    constructor(type: string, eventInitDict?: ExtendableEventInit)
    waitUntil(handler: Promise<any>) : void
}
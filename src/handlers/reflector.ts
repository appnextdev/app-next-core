export interface AppNextReflectEvents
{
    onMemberAttach(object: any, member: string, value: any) : void
    onMemberRemove(object: any, member: string) : void
    onMemberUpdate(object: any, member: string, value: any) : void
}

export class AppNextReflector
{
    constructor(events: AppNextReflectEvents)
    {
        this.events = events

        this.start()
    }

    private active: boolean
    private readonly events: AppNextReflectEvents

    private invoke(name: string, args: Array<any> = []) : void
    {
        const handler = (this.events as any)[name]

        if (this.active && handler instanceof Function) handler.apply(this, args)
    }

    public attach(object: any) : ProxyConstructor
    {
        return object instanceof Object ? new Proxy(object,
        {
            deleteProperty: (target, name) : boolean => 
            {
                if (name in target) 
                {
                    delete target[name]

                    this.invoke('onMemberRemove', [ target, name ])

                    return true
                }

                return false
            },

            set: (target, name, value) : boolean =>
            {
                var method

                if (name in target)
                {
                    value = 
                    {
                        current: value,
                        previous: target[name] instanceof Object ? JSON.parse(JSON.stringify(target[name])) : target[name]
                    }

                    method = 'onMemberUpdate'
                }
                else
                {
                    method = 'onMemberAttach'
                }

                target[name] = value; this.invoke(method, [ target, name, value ])

                return true
            }
        }) : null
    }

    public start() : void
    {
        this.active = true
    }

    public stop() : void
    {
        this.active = false
    }
}
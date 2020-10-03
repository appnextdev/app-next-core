import { AppNextDataEvents } from './data'
import { AppNextPermissionProvider } from '../providers/permission'

export interface AppNextWatcher
{
    request() : void | Promise<void> 
    start(options?: any) : void
    stop(options?: any) : void
}

export abstract class AppNextWatch<T> extends AppNextDataEvents<T> implements AppNextWatcher
{
    constructor(permissions: Array<PermissionName> | PermissionName)
    {
        super()

        this.permission = new AppNextPermissionProvider(permissions)

        this.permission.onCancel = error => this.invokeCancelEvent(error)
        this.permission.onError = error => this.invokeErrorEvent(error)
        this.permission.onPending = () => this.invokePendingEvent()
        this.permission.onReady = () => this.invokeReadyEvent()
    }

    protected readonly permission: AppNextPermissionProvider

    public request() : Promise<void> 
    {
        return this.permission.register()
    }

    public abstract start() : boolean | Promise<void>
    public abstract stop() : boolean | Promise<void>
}
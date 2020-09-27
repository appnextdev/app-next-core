import { AppNextDataEvents } from './data'
import { AppNextPermissionProvider } from '../providers/permission'

export abstract class AppNextWatch<T> extends AppNextDataEvents<T>
{
    constructor(permissions: Array<PermissionName> | PermissionName)
    {
        super()
        
        this.permission = new AppNextPermissionProvider(permissions)

        this.permission.onCancel = error => this.invokeCancelEvent(error)
        this.permission.onError = error => this.invokeErrorEvent(error)
        this.permission.onPending = () => this.invokePendingEvent()
    }

    protected readonly permission: AppNextPermissionProvider

    public request() : Promise<void> 
    {
        return this.permission.register()
    }

    public abstract start() : void
    public abstract stop() : void
}
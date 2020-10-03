import { AppNextDataEvents } from '../handlers/data'
import { Errors, error } from '../handlers/error'

export class AppNextPermissionProvider extends AppNextDataEvents<void>
{
    constructor(permissions: Array<PermissionName> | PermissionName)
    {
        super()

        this.permissions = Array.isArray(permissions) ? permissions : [ permissions ]
    }

    private readonly permissions: Array<PermissionName>

    public handle(permission: PermissionState | NotificationPermission | PushPermissionState)
    {
        try
        {
            switch (permission)
            {
                case 'granted': return this.invokeReadyEvent()
                case 'prompt': return this.invokePendingEvent()
                case 'denied': default: return this.invokeCancelEvent(error(Errors.permissionDenied))
            }
        }
        catch (error)
        {
            this.invokeErrorEvent(error)
        }
    }

    public register() : Promise<void>
    {
        const request = this.permissions.map(permission => navigator.permissions.query({ name: permission }))

        return Promise.all(request).then(permissions =>
        {
            permissions.forEach(permission =>
            {
                this.handle(permission.state)
                permission.onchange = () => this.handle(permission.state)
            })
        })
    }
}
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

    public handle(permission: PermissionState | NotificationPermission | PushPermissionState) : boolean
    {
        try
        {
            switch (permission)
            {
                case 'granted': this.invokeReadyEvent(); return true
                case 'prompt': this.invokePendingEvent(); return false
                case 'denied': default: this.invokeCancelEvent(error(Errors.permissionDenied)); return false
            }
        }
        catch (error)
        {
            this.invokeErrorEvent(error); return false
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
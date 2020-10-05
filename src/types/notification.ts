declare interface NotificationEventInit extends ExtendableEventInit 
{
    action: string
    notification: Notification
}

declare class NotificationEvent extends ExtendableEvent 
{
    constructor(type: string, eventInitDict: NotificationEventInit)

    readonly action: string
    readonly notification: Notification
}
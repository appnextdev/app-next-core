export enum Errors
{
    acceptNotSupported,
    captureNotSupported,
    downloadNotSupported,
    featureTerminated,
    invalidConfig,
    invalidFactoryFunction,
    permissionDenied
}

const errors: Record<string, { name: string, message: string }> =
{
    acceptNotSupported: { name: 'accept not supported', message: 'Input element "accept" attribute is not supported by this device' },
    captureNotSupported: { name: 'capture not supported', message: 'Input element "capture" attribute is not supported by this device' },
    downloadNotSupported: { name: 'download not supported', message: 'Link element "download" attribute is not supported by this device' },
    featureTerminated: { name: 'feature terminated', message: 'Current feature terminated due to user action' },
    invalidConfig: {name: 'invalid config', message: 'Config object is missing required members' }, 
    invalidFactoryFunction: { name: 'invalid factory', message: 'Factory function must provide a valid handler instance' },
    permissionDenied: { name: 'permission denied', message: 'Requested permission denied by user' }
}

export function error(code: Errors)
{
    const info = errors[Errors[code]]; if (!info) return new Error()
    
    const error = new Error(info.message)

    error.name = info.name; return error
}

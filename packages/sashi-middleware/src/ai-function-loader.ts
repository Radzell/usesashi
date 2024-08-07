import {z} from "zod"

type AllowedTypes =
    | "string"
    | "number"
    | "boolean"
    | AIField<string | number | boolean>[]

export type AIField<T> = {
    name: string
    type: T
    description: string
    required?: boolean
}

export type AINumber = AIField<"number">
export type AIString = AIField<"string">
export type AIBoolean = AIField<"boolean">
export type AIArray = AIField<AIField<string | number | boolean>[]>

export class AIObject {
    private _name: string
    private _description: string
    private _fields: (AIField<AllowedTypes> | AIObject)[]
    private _required: boolean

    constructor(name: string, description: string, required: boolean) {
        this._name = name
        this._description = description
        this._fields = []
        this._required = required
    }

    field<T extends AllowedTypes>(field: AIField<T> | AIObject) {
        this._fields.push(field)
        return this
    }

    getName(): string {
        return this._name
    }

    getDescription(): string {
        return this._description
    }

    getFields(): (AIField<AllowedTypes> | AIObject)[] {
        return this._fields
    }

    validateAIField = (
        field: AIField<AllowedTypes>
    ):
        | z.ZodString
        | z.ZodNumber
        | z.ZodBoolean
        | z.ZodArray<z.ZodTypeAny, "many">
        | z.ZodNull => {
        switch (field.type) {
            case "string":
                return z.string()
            case "number":
                return z.number()
            case "boolean":
                return z.boolean()
            default:
                return z.array(z.any()) // Adjust based on the specific type of array elements
        }
    }

    description(): Record<string, any> {
        return {
            type: "object",
            name: this._name,
            description: this._description,
            properties: this._fields.reduce(
                (acc, field) => {
                    if (field instanceof AIObject) {
                        return {
                            ...acc,
                            [field.getName()]: field.description()
                        }
                    } else {
                        return {
                            ...acc,
                            [field.name]: {
                                type: field.type,
                                description: field.description
                            }
                        }
                    }
                },
                {} as Record<string, any>
            )
        }
    }
    getRequired() {
        return this._required
    }
}

export class AIFunction {
    private _name: string

    private _description: string
    private _params: (AIField<any> | AIObject)[]
    private _returnType?: AIField<any> | AIObject
    private _implementation: Function

    constructor(name: string, description: string) {
        this._name = name
        this._description = description
        this._params = []
        this._implementation = () => {}
    }

    args(...params: (AIField<any> | AIObject)[]) {
        this._params = params
        return this
    }

    returns(returnType: AIField<any>) {
        this._returnType = returnType
        return this
    }

    implement(fn: (...args: any[]) => any) {
        this._implementation = fn
        return this
    }

    getName(): string {
        return this._name
    }

    getParams(): (AIField<any> | AIObject)[] {
        return this._params
    }

    validateAIField = (
        param: AIField<any> | AIObject
    ):
        | z.ZodString
        | z.ZodNumber
        | z.ZodBoolean
        | z.ZodArray<z.ZodAny, "many">
        | z.ZodNull
        | z.ZodAny => {
        if (param instanceof AIObject) {
            return z.any()
        } else {
            switch (param.type) {
                case "string":
                    return z.string()
                case "number":
                    return z.number()
                case "boolean":
                    return z.boolean()
                case "array":
                    return z.array(z.any()) // Adjust based on the specific type of array elements
                default:
                    return z.null()
            }
        }
    }

    description() {
        return {
            type: "function",
            function: {
                name: this._name,
                description: this._description,
                parameters: {
                    type: "object",

                    properties: this._params.reduce((acc, param) => {
                        if (param instanceof AIObject) {
                            return {
                                ...acc,
                                [param.getName()]: param.description()
                            }
                        } else {
                            return {
                                ...acc,
                                [param.name]: {
                                    type: param.type,
                                    description: param.description
                                }
                            }
                        }
                    }, {}),
                    required: this._params
                        .filter((param) => {
                            if (param instanceof AIObject) {
                                return param.getRequired()
                            } else {
                                return param.required
                            }
                        })
                        .map((param) => {
                            if (param instanceof AIObject) {
                                return param.getName()
                            } else {
                                return param.name
                            }
                        })
                }
            }
        }
    }

    execute(...args: any[]) {
        const parsedArgs = z
            .tuple(
                this._params.map(this.validateAIField) as [
                    z.ZodTypeAny,
                    ...z.ZodTypeAny[]
                ]
            )
            .parse(args)

        const result = this._implementation(...parsedArgs)
        if (this._returnType) {
            const returnTypeSchema = this.validateAIField(this._returnType)
            return returnTypeSchema.parse(result)
        }
        return result
    }
}

export interface FunctionMetadata<F extends AIFunction> {
    fn: F
}

interface RegisteredFunction<F extends AIFunction> extends FunctionMetadata<F> {
    name: string
}

type FunctionRegistry = Map<string, AIFunction>

const functionRegistry: FunctionRegistry = new Map()

export function getFunctionRegistry(): FunctionRegistry {
    return functionRegistry
}

export function registerFunctionIntoAI<F extends AIFunction>(
    name: string,
    fn: F
) {
    functionRegistry.set(fn.getName(), fn)
}

export async function callFunctionFromRegistry<F extends AIFunction>(
    name: string,
    ...args: any[]
): Promise<any> {
    const registeredFunction = functionRegistry.get(name)

    if (!registeredFunction) {
        throw new Error(`Function ${name} is not registered`)
    }

    // Call the function
    const result = await registeredFunction.execute(...args)

    return result
}

export async function callFunctionFromRegistryFromObject<F extends AIFunction>(
    name: string,
    argsObj: Record<string, any>
): Promise<any> {
    const registeredFunction = functionRegistry.get(name)

    if (!registeredFunction) {
        throw new Error(`Function ${name} is not registered`)
    }

    const args = registeredFunction.getParams().map((param) => {
        if (param instanceof AIObject) {
            return argsObj[param.getName()]
        } else {
            return argsObj[param.name]
        }
    })
    // Call the function
    const result = await registeredFunction.execute(...args)

    return result
}

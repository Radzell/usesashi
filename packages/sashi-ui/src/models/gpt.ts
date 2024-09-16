export namespace ChatCompletionMessageToolCall {
    /**
     * The function that the model called.
     */
    export interface Function {
        /**
         * The arguments to call the function with, as generated by the model in JSON
         * format. Note that the model does not always generate valid JSON, and may
         * hallucinate parameters not defined by your function schema. Validate the
         * arguments in your code before calling your function.
         */
        arguments: string

        /**
         * The name of the function to call.
         */
        name: string
    }
}

export interface ChatCompletionMessageToolCall {
    /**
     * The ID of the tool call.
     */
    id: string

    /**
     * The function that the model called.
     */
    function: ChatCompletionMessageToolCall.Function

    /**
     * The type of the tool. Currently, only `function` is supported.
     */
    type: "function"

    needsConfirm?: boolean
}

export interface ChatCompletionMessage {
    /**
     * The contents of the message.
     */
    content: string | null

    /**
     * The refusal message generated by the model.
     */
    refusal: string | null

    /**
     * The role of the author of this message.
     */
    role: "assistant"

    /**
     * The tool calls generated by the model, such as function calls.
     */
    tool_calls?: Array<ChatCompletionMessageToolCall>
}

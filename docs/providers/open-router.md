# Configurations for OpenRouter Models

## Web Search: 

***

title: Web Search
subtitle: Model-agnostic grounding
headline: Web Search | Add Real-time Web Data to AI Model Responses
canonical-url: '[https://openrouter.ai/docs/guides/features/plugins/web-search](https://openrouter.ai/docs/guides/features/plugins/web-search)'
'og:site\_name': OpenRouter Documentation
'og:title': Web Search - Real-time Web Grounding for AI Models
'og:description': >-
Enable real-time web search capabilities in your AI model responses. Add
factual, up-to-date information to any model's output with OpenRouter's web
search feature.
'og:image':
type: url
value: >-
[https://openrouter.ai/dynamic-og?pathname=features/web-search\&title=Web%20Search\&description=Add%20real-time%20web%20data%20to%20any%20AI%20model%20response](https://openrouter.ai/dynamic-og?pathname=features/web-search\&title=Web%20Search\&description=Add%20real-time%20web%20data%20to%20any%20AI%20model%20response)
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary\_large\_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---------------

You can incorporate relevant web search results for *any* model on OpenRouter by activating and customizing the `web` plugin, or by appending `:online` to the model slug:

```json
{
  "model": "openai/gpt-5.2:online"
}
```

You can also append `:online` to `:free` model variants like so:

```json
{
  "model": "openai/gpt-oss-20b:free:online"
}
```

<Note>
  Using web search will incur extra costs, even with free models. See the [pricing section](#pricing) below for details.
</Note>

`:online` is a shortcut for using the `web` plugin, and is exactly equivalent to:

```json
{
  "model": "openrouter/auto",
  "plugins": [{ "id": "web" }]
}
```

The web search plugin is powered by native search for Anthropic, OpenAI, Perplexity, and xAI models.

<Note>
  For xAI models, the web search plugin enables both Web Search and X Search.
</Note>

For other models, the web search plugin is powered by [Exa](https://exa.ai). It uses their ["auto"](https://docs.exa.ai/reference/how-exa-search-works#combining-neural-and-keyword-the-best-of-both-worlds-through-exa-auto-search) method (a combination of keyword search and embeddings-based web search) to find the most relevant results and augment/ground your prompt.

## Parsing web search results

Web search results for all models (including native-only models like Perplexity and OpenAI Online) are available in the API and standardized by OpenRouter to follow the same annotation schema in the [OpenAI Chat Completion Message type](https://platform.openai.com/docs/api-reference/chat/object):

```json
{
  "message": {
    "role": "assistant",
    "content": "Here's the latest news I found: ...",
    "annotations": [
      {
        "type": "url_citation",
        "url_citation": {
          "url": "https://www.example.com/web-search-result",
          "title": "Title of the web search result",
          "content": "Content of the web search result", // Added by OpenRouter if available
          "start_index": 100, // The index of the first character of the URL citation in the message.
          "end_index": 200 // The index of the last character of the URL citation in the message.
        }
      }
    ]
  }
}
```

## Customizing the Web Plugin

The maximum results allowed by the web plugin and the prompt used to attach them to your message stream can be customized:

```json
{
  "model": "openai/gpt-5.2:online",
  "plugins": [
    {
      "id": "web",
      "engine": "exa", // Optional: "native", "exa", or undefined
      "max_results": 1, // Defaults to 5
      "search_prompt": "Some relevant web results:" // See default below
    }
  ]
}
```

By default, the web plugin uses the following search prompt, using the current date:

```
A web search was conducted on `date`. Incorporate the following web search results into your response.

IMPORTANT: Cite them using markdown links named using the domain of the source.
Example: [nytimes.com](https://nytimes.com/some-page).
```

## Engine Selection

The web search plugin supports the following options for the `engine` parameter:

* **`native`**: Always uses the model provider's built-in web search capabilities
* **`exa`**: Uses Exa's search API for web results
* **`undefined` (not specified)**: Uses native search if available for the provider, otherwise falls back to Exa

### Default Behavior

When the `engine` parameter is not specified:

* **Native search is used by default** for OpenAI, Anthropic, Perplexity, and xAI models that support it
* **Exa search is used** for all other models or when native search is not supported

When you explicitly specify `"engine": "native"`, it will always attempt to use the provider's native search, even if the model doesn't support it (which may result in an error).

### Forcing Engine Selection

You can explicitly specify which engine to use:

```json
{
  "model": "openai/gpt-5.2",
  "plugins": [
    {
      "id": "web",
      "engine": "native"
    }
  ]
}
```

Or force Exa search even for models that support native search:

```json
{
  "model": "openai/gpt-5.2",
  "plugins": [
    {
      "id": "web",
      "engine": "exa",
      "max_results": 3
    }
  ]
}
```

### Engine-Specific Pricing

* **Native search**: Pricing is passed through directly from the provider (see provider-specific pricing info below)
* **Exa search**: Uses OpenRouter credits at \$4 per 1000 results (default 5 results = \$0.02 per request)

## Pricing

### Exa Search Pricing

When using Exa search (either explicitly via `"engine": "exa"` or as fallback), the web plugin uses your OpenRouter credits and charges *\$4 per 1000 results*. By default, `max_results` set to 5, this comes out to a maximum of \$0.02 per request, in addition to the LLM usage for the search result prompt tokens.

### Native Search Pricing (Provider Passthrough)

Some models have built-in web search. These models charge a fee based on the search context size, which determines how much search data is retrieved and processed for a query.

### Search Context Size Thresholds

Search context can be 'low', 'medium', or 'high' and determines how much search context is retrieved for a query:

* **Low**: Minimal search context, suitable for basic queries
* **Medium**: Moderate search context, good for general queries
* **High**: Extensive search context, ideal for detailed research

### Specifying Search Context Size

You can specify the search context size in your API request using the `web_search_options` parameter:

```json
{
  "model": "openai/gpt-4.1",
  "messages": [
    {
      "role": "user",
      "content": "What are the latest developments in quantum computing?"
    }
  ],
  "web_search_options": {
    "search_context_size": "high"
  }
}
```

<Note title="Native Web Search Pricing">
  Refer to each provider's documentation for their native web search pricing info:

  * [OpenAI Pricing](https://platform.openai.com/docs/pricing#built-in-tools)
  * [Anthropic Pricing](https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool#usage-and-pricing)
  * [Perplexity Pricing](https://docs.perplexity.ai/getting-started/pricing)
  * [xAI Pricing](https://docs.x.ai/docs/models#tool-invocation-costs)

  Native web search pricing only applies when using `"engine": "native"` or when native search is used by default for supported models. When using `"engine": "exa"`, the Exa search pricing applies instead.
</Note>


## Free Router

***

title: Free Models Router
subtitle: Get started with free AI inference using the OpenRouter Chat Playground
headline: Free Models Router | OpenRouter
canonical-url: '[https://openrouter.ai/docs/guides/guides/free-models-router-playground](https://openrouter.ai/docs/guides/guides/free-models-router-playground)'
'og:site\_name': OpenRouter Documentation
'og:title': Free Models Router
'og:description': >-
Learn how to use the Free Models Router in the OpenRouter Chat Playground for
zero-cost inference.
'og:image':
type: url
value: >-
[https://openrouter.ai/dynamic-og?title=Free%20Models%20Router%20in%20Chat%20Playground\&description=Get%20started%20with%20free%20AI%20inference](https://openrouter.ai/dynamic-og?title=Free%20Models%20Router%20in%20Chat%20Playground\&description=Get%20started%20with%20free%20AI%20inference)
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary\_large\_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---------------

OpenRouter offers free models that let you experiment with AI without any cost. The easiest way to try these models is through the [Chat Playground](https://openrouter.ai/chat), where you can start chatting immediately.

## Using the Free Models Router

The simplest way to get free inference is to use `openrouter/free`, our Free Models Router that automatically selects a free model at random from the available free models on OpenRouter. The router intelligently filters for models that support the features your request needs, such as image understanding, tool calling, and structured outputs.

### Step 1: Open the Chat Playground

Navigate to [openrouter.ai/chat](https://openrouter.ai/chat) to access the Chat Playground.

### Step 2: Search for Free Models

Click the **Add Model** button (or press `Cmd+K` / `Ctrl+K`) to open the model selector. Type "free" in the search box to filter for free models.

![Searching for free models in the model selector](file:ed6cbe38-026f-416c-b598-766f2c9e8b52)

You'll see a list of available free models, including the **Free Models Router** option.

### Step 3: Select the Free Models Router

Click on **Free Models Router** to select it. This router will automatically choose a free model for each request based on your needs.

![Free Models Router selected in the chat playground](file:054d0510-7fed-418d-95d0-b65fcd1400e5)

### Step 4: Start Chatting

Once selected, you can start sending messages. The Free Models Router will route your request to an appropriate free model, and you'll see which model responded in the chat.

![A response from a free model showing the model name](file:cadbd8b3-4fde-481b-8565-5db504e89532)

In this example, the Free Models Router selected Solar Pro 3 (free) to respond to the message.

## Selecting Specific Free Models

If you prefer to use a specific free model rather than the Free Models Router, you can select any model with "(free)" in its name from the model selector. Some popular free models include:

* **Trinity Large Preview (free)** - A frontier-scale open-weight model from Arcee
* **Trinity Mini (free)** - A smaller, faster variant
* **DeepSeek R1 (free)** - DeepSeek's reasoning model
* **Llama models (free)** - Various Meta Llama models

## Using Free Models via API

You can also use the Free Models Router programmatically. Simply set the model to `openrouter/free` in your API requests:

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openrouter/free",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

For more details on the Free Models Router API, see the [API Quickstart](https://openrouter.ai/openrouter/free/api).

## Free Model Limitations

Free models may have different rate limits and availability compared to paid models. They are ideal for experimentation, learning, and low-volume use cases. For production workloads with higher reliability requirements, consider using paid models.

## Related Resources

* [Free Variant Documentation](/docs/guides/routing/model-variants/free) - Learn about the `:free` variant suffix
* [Models Page](https://openrouter.ai/models) - Browse all available models
* [Free Models Router API](https://openrouter.ai/openrouter/free/api) - API quickstart for the Free Models Router


## Tool Calling

***

title: Tool & Function Calling
subtitle: Use tools in your prompts
headline: Tool & Function Calling | Use Tools with OpenRouter
canonical-url: '[https://openrouter.ai/docs/guides/features/tool-calling](https://openrouter.ai/docs/guides/features/tool-calling)'
'og:site\_name': OpenRouter Documentation
'og:title': Tool & Function Calling - Use Tools with OpenRouter
'og:description': >-
Use tools (or functions) in your prompts with OpenRouter. Learn how to use
tools with OpenAI, Anthropic, and other models that support tool calling.
'og:image':
type: url
value: >-
[https://openrouter.ai/dynamic-og?title=Tool%20&%20Function%20Calling\&description=Use%20tools%20with%20OpenRouter](https://openrouter.ai/dynamic-og?title=Tool%20&%20Function%20Calling\&description=Use%20tools%20with%20OpenRouter)
'og:image:width': 1200
'og:image:height': 630
'twitter:card': summary\_large\_image
'twitter:site': '@OpenRouterAI'
noindex: false
nofollow: false
---------------

Tool calls (also known as function calls) give an LLM access to external tools. The LLM does not call the tools directly. Instead, it suggests the tool to call. The user then calls the tool separately and provides the results back to the LLM. Finally, the LLM formats the response into an answer to the user's original question.

OpenRouter standardizes the tool calling interface across models and providers, making it easy to integrate external tools with any supported model.

**Supported Models**: You can find models that support tool calling by filtering on [openrouter.ai/models?supported\_parameters=tools](https://openrouter.ai/models?supported_parameters=tools).

If you prefer to learn from a full end-to-end example, keep reading.

## Request Body Examples

Tool calling with OpenRouter involves three key steps. Here are the essential request body formats for each step:

### Step 1: Inference Request with Tools

```json
{
  "model": "google/gemini-3-flash-preview",
  "messages": [
    {
      "role": "user",
      "content": "What are the titles of some James Joyce books?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "search_gutenberg_books",
        "description": "Search for books in the Project Gutenberg library",
        "parameters": {
          "type": "object",
          "properties": {
            "search_terms": {
              "type": "array",
              "items": {"type": "string"},
              "description": "List of search terms to find books"
            }
          },
          "required": ["search_terms"]
        }
      }
    }
  ]
}
```

### Step 2: Tool Execution (Client-Side)

After receiving the model's response with `tool_calls`, execute the requested tool locally and prepare the result:

```javascript
// Model responds with tool_calls, you execute the tool locally
const toolResult = await searchGutenbergBooks(["James", "Joyce"]);
```

### Step 3: Inference Request with Tool Results

```json
{
  "model": "google/gemini-3-flash-preview",
  "messages": [
    {
      "role": "user",
      "content": "What are the titles of some James Joyce books?"
    },
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_abc123",
          "type": "function",
          "function": {
            "name": "search_gutenberg_books",
            "arguments": "{\"search_terms\": [\"James\", \"Joyce\"]}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_abc123",
      "content": "[{\"id\": 4300, \"title\": \"Ulysses\", \"authors\": [{\"name\": \"Joyce, James\"}]}]"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "search_gutenberg_books",
        "description": "Search for books in the Project Gutenberg library",
        "parameters": {
          "type": "object",
          "properties": {
            "search_terms": {
              "type": "array",
              "items": {"type": "string"},
              "description": "List of search terms to find books"
            }
          },
          "required": ["search_terms"]
        }
      }
    }
  ]
}
```

**Note**: The `tools` parameter must be included in every request (Steps 1 and 3) so the router can validate the tool schema on each call.

### Tool Calling Example

Here is Python code that gives LLMs the ability to call an external API -- in this case Project Gutenberg, to search for books.

First, let's do some basic setup:

<Template
  data={{
  API_KEY_REF,
  MODEL: 'google/gemini-3-flash-preview'
}}
>
  <CodeGroup>
    ```typescript title="TypeScript SDK"
    import { OpenRouter } from '@openrouter/sdk';

    const OPENROUTER_API_KEY = "{{API_KEY_REF}}";

    // You can use any model that supports tool calling
    const MODEL = "{{MODEL}}";

    const openRouter = new OpenRouter({
      apiKey: OPENROUTER_API_KEY,
    });

    const task = "What are the titles of some James Joyce books?";

    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: task,
      }
    ];
    ```

    ```python
    import json, requests
    from openai import OpenAI

    OPENROUTER_API_KEY = f"{{API_KEY_REF}}"

    # You can use any model that supports tool calling
    MODEL = "{{MODEL}}"

    openai_client = OpenAI(
      base_url="https://openrouter.ai/api/v1",
      api_key=OPENROUTER_API_KEY,
    )

    task = "What are the titles of some James Joyce books?"

    messages = [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": task,
      }
    ]

    ```

    ```typescript title="TypeScript (fetch)"
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer {{API_KEY_REF}}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: '{{MODEL}}',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          {
            role: 'user',
            content: 'What are the titles of some James Joyce books?',
          },
        ],
      }),
    });
    ```
  </CodeGroup>
</Template>

### Define the Tool

Next, we define the tool that we want to call. Remember, the tool is going to get *requested* by the LLM, but the code we are writing here is ultimately responsible for executing the call and returning the results to the LLM.

<Template
  data={{
  API_KEY_REF,
  MODEL: 'google/gemini-3-flash-preview'
}}
>
  <CodeGroup>
    ```typescript title="TypeScript SDK"
    async function searchGutenbergBooks(searchTerms: string[]): Promise<Book[]> {
      const searchQuery = searchTerms.join(' ');
      const url = 'https://gutendex.com/books';
      const response = await fetch(`${url}?search=${searchQuery}`);
      const data = await response.json();

      return data.results.map((book: any) => ({
        id: book.id,
        title: book.title,
        authors: book.authors,
      }));
    }

    const tools = [
      {
        type: 'function',
        function: {
          name: 'searchGutenbergBooks',
          description:
            'Search for books in the Project Gutenberg library based on specified search terms',
          parameters: {
            type: 'object',
            properties: {
              search_terms: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description:
                  "List of search terms to find books in the Gutenberg library (e.g. ['dickens', 'great'] to search for books by Dickens with 'great' in the title)",
              },
            },
            required: ['search_terms'],
          },
        },
      },
    ];

    const TOOL_MAPPING = {
      searchGutenbergBooks,
    };
    ```

    ```python
    def search_gutenberg_books(search_terms):
        search_query = " ".join(search_terms)
        url = "https://gutendex.com/books"
        response = requests.get(url, params={"search": search_query})

        simplified_results = []
        for book in response.json().get("results", []):
            simplified_results.append({
                "id": book.get("id"),
                "title": book.get("title"),
                "authors": book.get("authors")
            })

        return simplified_results

    tools = [
      {
        "type": "function",
        "function": {
          "name": "search_gutenberg_books",
          "description": "Search for books in the Project Gutenberg library based on specified search terms",
          "parameters": {
            "type": "object",
            "properties": {
              "search_terms": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "List of search terms to find books in the Gutenberg library (e.g. ['dickens', 'great'] to search for books by Dickens with 'great' in the title)"
              }
            },
            "required": ["search_terms"]
          }
        }
      }
    ]

    TOOL_MAPPING = {
        "search_gutenberg_books": search_gutenberg_books
    }

    ```
  </CodeGroup>
</Template>

Note that the "tool" is just a normal function. We then write a JSON "spec" compatible with the OpenAI function calling parameter. We'll pass that spec to the LLM so that it knows this tool is available and how to use it. It will request the tool when needed, along with any arguments. We'll then marshal the tool call locally, make the function call, and return the results to the LLM.

### Tool use and tool results

Let's make the first OpenRouter API call to the model:

<Template
  data={{
  API_KEY_REF,
  MODEL: 'google/gemini-3-flash-preview'
}}
>
  <CodeGroup>
    ```typescript title="TypeScript SDK"
    const result = await openRouter.chat.send({
      model: '{{MODEL}}',
      tools,
      messages,
      stream: false,
    });

    const response_1 = result.choices[0].message;
    ```

    ```python
    request_1 = {
        "model": {{MODEL}},
        "tools": tools,
        "messages": messages
    }

    response_1 = openai_client.chat.completions.create(**request_1).message
    ```

    ```typescript title="TypeScript (fetch)"
    const request_1 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer {{API_KEY_REF}}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: '{{MODEL}}',
        tools,
        messages,
      }),
    });

    const data = await request_1.json();
    const response_1 = data.choices[0].message;
    ```
  </CodeGroup>
</Template>

The LLM responds with a finish reason of `tool_calls`, and a `tool_calls` array. In a generic LLM response-handler, you would want to check the `finish_reason` before processing tool calls, but here we will assume it's the case. Let's keep going, by processing the tool call:

<Template
  data={{
  API_KEY_REF,
  MODEL: 'google/gemini-3-flash-preview'
}}
>
  <CodeGroup>
    ```typescript title="TypeScript SDK"
    // Append the response to the messages array so the LLM has the full context
    // It's easy to forget this step!
    messages.push(response_1);

    // Now we process the requested tool calls, and use our book lookup tool
    for (const toolCall of response_1.tool_calls) {
      const toolName = toolCall.function.name;
      const { search_params } = JSON.parse(toolCall.function.arguments);
      const toolResponse = await TOOL_MAPPING[toolName](search_params);
      messages.push({
        role: 'tool',
        toolCallId: toolCall.id,
        name: toolName,
        content: JSON.stringify(toolResponse),
      });
    }
    ```

    ```python
    # Append the response to the messages array so the LLM has the full context
    # It's easy to forget this step!
    messages.append(response_1)

    # Now we process the requested tool calls, and use our book lookup tool
    for tool_call in response_1.tool_calls:
        '''
        In this case we only provided one tool, so we know what function to call.
        When providing multiple tools, you can inspect `tool_call.function.name`
        to figure out what function you need to call locally.
        '''
        tool_name = tool_call.function.name
        tool_args = json.loads(tool_call.function.arguments)
        tool_response = TOOL_MAPPING[tool_name](**tool_args)
        messages.append({
          "role": "tool",
          "tool_call_id": tool_call.id,
          "content": json.dumps(tool_response),
        })
    ```
  </CodeGroup>
</Template>

The messages array now has:

1. Our original request
2. The LLM's response (containing a tool call request)
3. The result of the tool call (a json object returned from the Project Gutenberg API)

Now, we can make a second OpenRouter API call, and hopefully get our result!

<Template
  data={{
  API_KEY_REF,
  MODEL: 'google/gemini-3-flash-preview'
}}
>
  <CodeGroup>
    ```typescript title="TypeScript SDK"
    const response_2 = await openRouter.chat.send({
      model: '{{MODEL}}',
      messages,
      tools,
      stream: false,
    });

    console.log(response_2.choices[0].message.content);
    ```

    ```python
    request_2 = {
      "model": MODEL,
      "messages": messages,
      "tools": tools
    }

    response_2 = openai_client.chat.completions.create(**request_2)

    print(response_2.choices[0].message.content)
    ```

    ```typescript title="TypeScript (fetch)"
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer {{API_KEY_REF}}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: '{{MODEL}}',
        messages,
        tools,
      }),
    });

    const data = await response.json();
    console.log(data.choices[0].message.content);
    ```
  </CodeGroup>
</Template>

The output will be something like:

```text
Here are some books by James Joyce:

*   *Ulysses*
*   *Dubliners*
*   *A Portrait of the Artist as a Young Man*
*   *Chamber Music*
*   *Exiles: A Play in Three Acts*
```

We did it! We've successfully used a tool in a prompt.

## Interleaved Thinking

Interleaved thinking allows models to reason between tool calls, enabling more sophisticated decision-making after receiving tool results. This feature helps models chain multiple tool calls with reasoning steps in between and make nuanced decisions based on intermediate results.

**Important**: Interleaved thinking increases token usage and response latency. Consider your budget and performance requirements when enabling this feature.

### How Interleaved Thinking Works

With interleaved thinking, the model can:

* Reason about the results of a tool call before deciding what to do next
* Chain multiple tool calls with reasoning steps in between
* Make more nuanced decisions based on intermediate results
* Provide transparent reasoning for its tool selection process

### Example: Multi-Step Research with Reasoning

Here's an example showing how a model might use interleaved thinking to research a topic across multiple sources:

**Initial Request:**

```json
{
  "model": "anthropic/claude-sonnet-4.5",
  "messages": [
    {
      "role": "user",
      "content": "Research the environmental impact of electric vehicles and provide a comprehensive analysis."
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "search_academic_papers",
        "description": "Search for academic papers on a given topic",
        "parameters": {
          "type": "object",
          "properties": {
            "query": {"type": "string"},
            "field": {"type": "string"}
          },
          "required": ["query"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "get_latest_statistics",
        "description": "Get latest statistics on a topic",
        "parameters": {
          "type": "object",
          "properties": {
            "topic": {"type": "string"},
            "year": {"type": "integer"}
          },
          "required": ["topic"]
        }
      }
    }
  ]
}
```

**Model's Reasoning and Tool Calls:**

1. **Initial Thinking**: "I need to research electric vehicle environmental impact. Let me start with academic papers to get peer-reviewed research."

2. **First Tool Call**: `search_academic_papers({"query": "electric vehicle lifecycle environmental impact", "field": "environmental science"})`

3. **After First Tool Result**: "The papers show mixed results on manufacturing impact. I need current statistics to complement this academic research."

4. **Second Tool Call**: `get_latest_statistics({"topic": "electric vehicle carbon footprint", "year": 2024})`

5. **After Second Tool Result**: "Now I have both academic research and current data. Let me search for manufacturing-specific studies to address the gaps I found."

6. **Third Tool Call**: `search_academic_papers({"query": "electric vehicle battery manufacturing environmental cost", "field": "materials science"})`

7. **Final Analysis**: Synthesizes all gathered information into a comprehensive response.

### Best Practices for Interleaved Thinking

* **Clear Tool Descriptions**: Provide detailed descriptions so the model can reason about when to use each tool
* **Structured Parameters**: Use well-defined parameter schemas to help the model make precise tool calls
* **Context Preservation**: Maintain conversation context across multiple tool interactions
* **Error Handling**: Design tools to provide meaningful error messages that help the model adjust its approach

### Implementation Considerations

When implementing interleaved thinking:

* Models may take longer to respond due to additional reasoning steps
* Token usage will be higher due to the reasoning process
* The quality of reasoning depends on the model's capabilities
* Some models may be better suited for this approach than others

## A Simple Agentic Loop

In the example above, the calls are made explicitly and sequentially. To handle a wide variety of user inputs and tool calls, you can use an agentic loop.

Here's an example of a simple agentic loop (using the same `tools` and initial `messages` as above):

<Template
  data={{
  API_KEY_REF,
  MODEL: 'google/gemini-3-flash-preview'
}}
>
  <CodeGroup>
    ```typescript title="TypeScript SDK"
    async function callLLM(messages: Message[]): Promise<ChatResponse> {
      const result = await openRouter.chat.send({
        model: '{{MODEL}}',
        tools,
        messages,
        stream: false,
      });

      messages.push(result.choices[0].message);
      return result;
    }

    async function getToolResponse(response: ChatResponse): Promise<Message> {
      const toolCall = response.choices[0].message.toolCalls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      // Look up the correct tool locally, and call it with the provided arguments
      // Other tools can be added without changing the agentic loop
      const toolResult = await TOOL_MAPPING[toolName](toolArgs);

      return {
        role: 'tool',
        toolCallId: toolCall.id,
        content: toolResult,
      };
    }

    const maxIterations = 10;
    let iterationCount = 0;

    while (iterationCount < maxIterations) {
      iterationCount++;
      const response = await callLLM(messages);

      if (response.choices[0].message.toolCalls) {
        messages.push(await getToolResponse(response));
      } else {
        break;
      }
    }

    if (iterationCount >= maxIterations) {
      console.warn("Warning: Maximum iterations reached");
    }

    console.log(messages[messages.length - 1].content);
    ```

    ```python

    def call_llm(msgs):
        resp = openai_client.chat.completions.create(
            model={{MODEL}},
            tools=tools,
            messages=msgs
        )
        msgs.append(resp.choices[0].message.dict())
        return resp

    def get_tool_response(response):
        tool_call = response.choices[0].message.tool_calls[0]
        tool_name = tool_call.function.name
        tool_args = json.loads(tool_call.function.arguments)

        # Look up the correct tool locally, and call it with the provided arguments
        # Other tools can be added without changing the agentic loop
        tool_result = TOOL_MAPPING[tool_name](**tool_args)

        return {
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": tool_result,
        }

    max_iterations = 10
    iteration_count = 0

    while iteration_count < max_iterations:
        iteration_count += 1
        resp = call_llm(_messages)

        if resp.choices[0].message.tool_calls is not None:
            messages.append(get_tool_response(resp))
        else:
            break

    if iteration_count >= max_iterations:
        print("Warning: Maximum iterations reached")

    print(messages[-1]['content'])

    ```
  </CodeGroup>
</Template>

## Best Practices and Advanced Patterns

### Function Definition Guidelines

When defining tools for LLMs, follow these best practices:

**Clear and Descriptive Names**: Use descriptive function names that clearly indicate the tool's purpose.

```json
// Good: Clear and specific
{ "name": "get_weather_forecast" }
```

```json
// Avoid: Too vague
{ "name": "weather" }
```

**Comprehensive Descriptions**: Provide detailed descriptions that help the model understand when and how to use the tool.

```json
{
  "description": "Get current weather conditions and 5-day forecast for a specific location. Supports cities, zip codes, and coordinates.",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City name, zip code, or coordinates (lat,lng). Examples: 'New York', '10001', '40.7128,-74.0060'"
      },
      "units": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"],
        "description": "Temperature unit preference",
        "default": "celsius"
      }
    },
    "required": ["location"]
  }
}
```

### Streaming with Tool Calls

When using streaming responses with tool calls, handle the different content types appropriately:

```typescript
const stream = await fetch('/api/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'anthropic/claude-sonnet-4.5',
    messages: messages,
    tools: tools,
    stream: true
  })
});

const reader = stream.body.getReader();
let toolCalls = [];

while (true) {
  const { done, value } = await reader.read();
  if (done) {
    break;
  }

  const chunk = new TextDecoder().decode(value);
  const lines = chunk.split('\n').filter(line => line.trim());

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));

      if (data.choices[0].delta.tool_calls) {
        toolCalls.push(...data.choices[0].delta.tool_calls);
      }

      if (data.choices[0].delta.finish_reason === 'tool_calls') {
        await handleToolCalls(toolCalls);
      } else if (data.choices[0].delta.finish_reason === 'stop') {
        // Regular completion without tool calls
        break;
      }
    }
  }
}
```

### Tool Choice Configuration

Control tool usage with the `tool_choice` parameter:

```json
// Let model decide (default)
{ "tool_choice": "auto" }
```

```json
// Disable tool usage
{ "tool_choice": "none" }
```

```json
// Force specific tool
{
  "tool_choice": {
    "type": "function",
    "function": {"name": "search_database"}
  }
}
```

### Parallel Tool Calls

Control whether multiple tools can be called simultaneously with the `parallel_tool_calls` parameter (default is true for most models):

```json
// Disable parallel tool calls - tools will be called sequentially
{ "parallel_tool_calls": false }
```

When `parallel_tool_calls` is `false`, the model will only request one tool call at a time instead of potentially multiple calls in parallel.

### Multi-Tool Workflows

Design tools that work well together:

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "search_products",
        "description": "Search for products in the catalog"
      }
    },
    {
      "type": "function",
      "function": {
        "name": "get_product_details",
        "description": "Get detailed information about a specific product"
      }
    },
    {
      "type": "function",
      "function": {
        "name": "check_inventory",
        "description": "Check current inventory levels for a product"
      }
    }
  ]
}
```

This allows the model to naturally chain operations: search → get details → check inventory.

For more details on OpenRouter's message format and tool parameters, see the [API Reference](https://openrouter.ai/docs/api-reference/overview).

##
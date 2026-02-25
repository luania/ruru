import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ResponseObject } from "openapi3-ts/oas31";
import { cn } from "../../../../../../lib/utils";
import { Button } from "../../../../../ui/Button";
import { Input } from "../../../../../ui/Input";
import { ConfirmPopover } from "../../../../../ui/ConfirmPopover";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../../ui/Popover";
import { MediaTypeSchemaEditor } from "../../../MediaTypeSchemaEditor";

interface ResponsesEditorProps {
  responses?: Record<string, ResponseObject>;
  onChange: (responses: Record<string, ResponseObject>) => void;
}

export const ResponsesEditor = ({
  responses,
  onChange,
}: ResponsesEditorProps) => {
  const [activeResponseCode, setActiveResponseCode] = useState<string | null>(
    null,
  );
  const [customStatusCode, setCustomStatusCode] = useState("");

  const codes = Object.keys(responses || {});
  const currentCode =
    activeResponseCode && codes.includes(activeResponseCode)
      ? activeResponseCode
      : codes[0];

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-400">Responses</div>
      <div className="flex items-center gap-2 pb-2 overflow-x-auto">
        {codes.map((code) => (
          <button
            key={code}
            onClick={() => setActiveResponseCode(code)}
            className={cn(
              "px-3 py-1.5 text-sm font-mono rounded-md transition-colors border border-transparent",
              (activeResponseCode || codes[0]) === code
                ? code.startsWith("2")
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : code.startsWith("3")
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : code.startsWith("4")
                      ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                : "text-gray-500 hover:text-gray-300 hover:bg-[#2a2d2e]",
            )}
          >
            {code}
          </button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus size={14} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-400 px-2">
                Add Response
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  "200",
                  "201",
                  "204",
                  "400",
                  "401",
                  "403",
                  "404",
                  "500",
                  "default",
                ].map((code) => (
                  <Button
                    key={code}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-xs text-gray-300 hover:text-white hover:bg-[#3e3e42]",
                      responses?.[code] && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => {
                      const newResponses = { ...(responses || {}) };
                      if (newResponses[code]) return;
                      newResponses[code] = { description: "" };
                      onChange(newResponses);
                      setActiveResponseCode(code);
                    }}
                    disabled={!!responses?.[code]}
                  >
                    {code}
                  </Button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#3e3e42] mt-2">
                <div className="text-xs font-medium text-gray-400 px-2 mb-2">
                  Custom Status Code
                </div>
                <div className="flex gap-2 px-2">
                  <Input
                    value={customStatusCode}
                    onChange={(e) => setCustomStatusCode(e.target.value)}
                    placeholder="e.g. 422"
                    className="h-7 text-xs bg-[#1e1e1e] border-[#3e3e42]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (
                          !customStatusCode ||
                          !!responses?.[customStatusCode]
                        )
                          return;
                        const newResponses = { ...(responses || {}) };
                        newResponses[customStatusCode] = { description: "" };
                        onChange(newResponses);
                        setActiveResponseCode(customStatusCode);
                        setCustomStatusCode("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs"
                    disabled={
                      !customStatusCode || !!responses?.[customStatusCode]
                    }
                    onClick={() => {
                      const newResponses = { ...(responses || {}) };
                      if (newResponses[customStatusCode]) return;
                      newResponses[customStatusCode] = { description: "" };
                      onChange(newResponses);
                      setActiveResponseCode(customStatusCode);
                      setCustomStatusCode("");
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {currentCode && (
        <ResponseDetail
          response={responses![currentCode] as ResponseObject}
          onChange={(newResponse) => {
            const newResponses = { ...(responses || {}) };
            newResponses[currentCode] = newResponse;
            onChange(newResponses);
          }}
          onDelete={() => {
            const newResponses = { ...(responses || {}) };
            delete newResponses[currentCode];
            onChange(newResponses);
            setActiveResponseCode(null);
          }}
        />
      )}
    </div>
  );
};

interface ResponseDetailProps {
  response: ResponseObject;
  onChange: (response: ResponseObject) => void;
  onDelete: () => void;
}

const ResponseDetail = ({
  response,
  onChange,
  onDelete,
}: ResponseDetailProps) => {
  return (
    <div className="border border-[#3e3e42] rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={response.description || ""}
            onChange={(e) =>
              onChange({ ...response, description: e.target.value })
            }
            placeholder="Description"
            className="flex-1 bg-transparent border-transparent hover:border-[#3e3e42] focus:border-blue-500"
          />
        </div>
        <ConfirmPopover
          title="Delete Response"
          description="Are you sure you want to delete this response?"
          onConfirm={onDelete}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-red-400"
            >
              <Trash2 size={14} />
            </Button>
          }
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase">
          Response Body
        </div>

        {Object.keys(response.content || {}).length === 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...response,
                content: {
                  "application/json": {
                    schema: { type: "object", properties: {} },
                  },
                },
              })
            }
          >
            <Plus size={14} className="mr-2" /> Add Default Body (JSON)
          </Button>
        ) : (
          <MediaTypeSchemaEditor
            content={response.content || {}}
            onChange={(content) => onChange({ ...response, content })}
            mediaTypeContext="response"
          />
        )}
      </div>
    </div>
  );
};

export default
{
  "nested": {
    "krpc": {
      "nested": {
        "schema": {
          "options": {
            "csharp_namespace": "KRPC.Schema.KRPC",
            "java_package": "krpc.schema",
            "java_outer_classname": "KRPC",
            "objc_class_prefix": "KRPC"
          },
          "nested": {
            "ConnectionRequest": {
              "fields": {
                "type": {
                  "type": "Type",
                  "id": 1
                },
                "clientName": {
                  "type": "string",
                  "id": 2
                },
                "clientIdentifier": {
                  "type": "bytes",
                  "id": 3
                }
              },
              "nested": {
                "Type": {
                  "values": {
                    "RPC": 0,
                    "STREAM": 1
                  }
                }
              }
            },
            "ConnectionResponse": {
              "fields": {
                "status": {
                  "type": "Status",
                  "id": 1
                },
                "message": {
                  "type": "string",
                  "id": 2
                },
                "clientIdentifier": {
                  "type": "bytes",
                  "id": 3
                }
              },
              "nested": {
                "Status": {
                  "values": {
                    "OK": 0,
                    "MALFORMED_MESSAGE": 1,
                    "TIMEOUT": 2,
                    "WRONG_TYPE": 3
                  }
                }
              }
            },
            "Request": {
              "fields": {
                "calls": {
                  "rule": "repeated",
                  "type": "ProcedureCall",
                  "id": 1
                }
              }
            },
            "ProcedureCall": {
              "fields": {
                "service": {
                  "type": "string",
                  "id": 1
                },
                "procedure": {
                  "type": "string",
                  "id": 2
                },
                "serviceId": {
                  "type": "uint32",
                  "id": 4
                },
                "procedureId": {
                  "type": "uint32",
                  "id": 5
                },
                "arguments": {
                  "rule": "repeated",
                  "type": "Argument",
                  "id": 3
                }
              }
            },
            "Argument": {
              "fields": {
                "position": {
                  "type": "uint32",
                  "id": 1
                },
                "value": {
                  "type": "bytes",
                  "id": 2
                }
              }
            },
            "Response": {
              "fields": {
                "error": {
                  "type": "Error",
                  "id": 1
                },
                "results": {
                  "rule": "repeated",
                  "type": "ProcedureResult",
                  "id": 2
                }
              }
            },
            "ProcedureResult": {
              "fields": {
                "error": {
                  "type": "Error",
                  "id": 1
                },
                "value": {
                  "type": "bytes",
                  "id": 2
                }
              }
            },
            "Error": {
              "fields": {
                "service": {
                  "type": "string",
                  "id": 1
                },
                "name": {
                  "type": "string",
                  "id": 2
                },
                "description": {
                  "type": "string",
                  "id": 3
                },
                "stackTrace": {
                  "type": "string",
                  "id": 4
                }
              }
            },
            "StreamUpdate": {
              "fields": {
                "results": {
                  "rule": "repeated",
                  "type": "StreamResult",
                  "id": 1
                }
              }
            },
            "StreamResult": {
              "fields": {
                "id": {
                  "type": "uint64",
                  "id": 1
                },
                "result": {
                  "type": "ProcedureResult",
                  "id": 2
                }
              }
            },
            "Services": {
              "fields": {
                "services": {
                  "rule": "repeated",
                  "type": "Service",
                  "id": 1
                }
              }
            },
            "Service": {
              "fields": {
                "name": {
                  "type": "string",
                  "id": 1
                },
                "procedures": {
                  "rule": "repeated",
                  "type": "Procedure",
                  "id": 2
                },
                "classes": {
                  "rule": "repeated",
                  "type": "Class",
                  "id": 3
                },
                "enumerations": {
                  "rule": "repeated",
                  "type": "Enumeration",
                  "id": 4
                },
                "exceptions": {
                  "rule": "repeated",
                  "type": "Exception",
                  "id": 5
                },
                "documentation": {
                  "type": "string",
                  "id": 6
                }
              }
            },
            "Procedure": {
              "fields": {
                "name": {
                  "type": "string",
                  "id": 1
                },
                "parameters": {
                  "rule": "repeated",
                  "type": "Parameter",
                  "id": 2
                },
                "returnType": {
                  "type": "Type",
                  "id": 3
                },
                "returnIsNullable": {
                  "type": "bool",
                  "id": 4
                },
                "gameScenes": {
                  "rule": "repeated",
                  "type": "GameScene",
                  "id": 6
                },
                "documentation": {
                  "type": "string",
                  "id": 5
                }
              },
              "nested": {
                "GameScene": {
                  "values": {
                    "SPACE_CENTER": 0,
                    "FLIGHT": 1,
                    "TRACKING_STATION": 2,
                    "EDITOR_VAB": 3,
                    "EDITOR_SPH": 4,
                    "MISSION_BUILDER": 5
                  }
                }
              }
            },
            "Parameter": {
              "fields": {
                "name": {
                  "type": "string",
                  "id": 1
                },
                "type": {
                  "type": "Type",
                  "id": 2
                },
                "defaultValue": {
                  "type": "bytes",
                  "id": 3
                }
              }
            },
            "Class": {
              "fields": {
                "name": {
                  "type": "string",
                  "id": 1
                },
                "documentation": {
                  "type": "string",
                  "id": 2
                }
              }
            },
            "Enumeration": {
              "fields": {
                "name": {
                  "type": "string",
                  "id": 1
                },
                "values": {
                  "rule": "repeated",
                  "type": "EnumerationValue",
                  "id": 2
                },
                "documentation": {
                  "type": "string",
                  "id": 3
                }
              }
            },
            "EnumerationValue": {
              "fields": {
                "name": {
                  "type": "string",
                  "id": 1
                },
                "value": {
                  "type": "int32",
                  "id": 2
                },
                "documentation": {
                  "type": "string",
                  "id": 3
                }
              }
            },
            "Exception": {
              "fields": {
                "name": {
                  "type": "string",
                  "id": 1
                },
                "documentation": {
                  "type": "string",
                  "id": 2
                }
              }
            },
            "Type": {
              "fields": {
                "code": {
                  "type": "TypeCode",
                  "id": 1
                },
                "service": {
                  "type": "string",
                  "id": 2
                },
                "name": {
                  "type": "string",
                  "id": 3
                },
                "types": {
                  "rule": "repeated",
                  "type": "Type",
                  "id": 4
                }
              },
              "nested": {
                "TypeCode": {
                  "values": {
                    "NONE": 0,
                    "DOUBLE": 1,
                    "FLOAT": 2,
                    "SINT32": 3,
                    "SINT64": 4,
                    "UINT32": 5,
                    "UINT64": 6,
                    "BOOL": 7,
                    "STRING": 8,
                    "BYTES": 9,
                    "CLASS": 100,
                    "ENUMERATION": 101,
                    "EVENT": 200,
                    "PROCEDURE_CALL": 201,
                    "STREAM": 202,
                    "STATUS": 203,
                    "SERVICES": 204,
                    "TUPLE": 300,
                    "LIST": 301,
                    "SET": 302,
                    "DICTIONARY": 303
                  }
                }
              }
            },
            "Tuple": {
              "fields": {
                "items": {
                  "rule": "repeated",
                  "type": "bytes",
                  "id": 1
                }
              }
            },
            "List": {
              "fields": {
                "items": {
                  "rule": "repeated",
                  "type": "bytes",
                  "id": 1
                }
              }
            },
            "Set": {
              "fields": {
                "items": {
                  "rule": "repeated",
                  "type": "bytes",
                  "id": 1
                }
              }
            },
            "Dictionary": {
              "fields": {
                "entries": {
                  "rule": "repeated",
                  "type": "DictionaryEntry",
                  "id": 1
                }
              }
            },
            "DictionaryEntry": {
              "fields": {
                "key": {
                  "type": "bytes",
                  "id": 1
                },
                "value": {
                  "type": "bytes",
                  "id": 2
                }
              }
            },
            "Stream": {
              "fields": {
                "id": {
                  "type": "uint64",
                  "id": 1
                }
              }
            },
            "Event": {
              "fields": {
                "stream": {
                  "type": "Stream",
                  "id": 1
                }
              }
            },
            "Status": {
              "fields": {
                "version": {
                  "type": "string",
                  "id": 1
                },
                "bytesRead": {
                  "type": "uint64",
                  "id": 2
                },
                "bytesWritten": {
                  "type": "uint64",
                  "id": 3
                },
                "bytesReadRate": {
                  "type": "float",
                  "id": 4
                },
                "bytesWrittenRate": {
                  "type": "float",
                  "id": 5
                },
                "rpcsExecuted": {
                  "type": "uint64",
                  "id": 6
                },
                "rpcRate": {
                  "type": "float",
                  "id": 7
                },
                "oneRpcPerUpdate": {
                  "type": "bool",
                  "id": 8
                },
                "maxTimePerUpdate": {
                  "type": "uint32",
                  "id": 9
                },
                "adaptiveRateControl": {
                  "type": "bool",
                  "id": 10
                },
                "blockingRecv": {
                  "type": "bool",
                  "id": 11
                },
                "recvTimeout": {
                  "type": "uint32",
                  "id": 12
                },
                "timePerRpcUpdate": {
                  "type": "float",
                  "id": 13
                },
                "pollTimePerRpcUpdate": {
                  "type": "float",
                  "id": 14
                },
                "execTimePerRpcUpdate": {
                  "type": "float",
                  "id": 15
                },
                "streamRpcs": {
                  "type": "uint32",
                  "id": 16
                },
                "streamRpcsExecuted": {
                  "type": "uint64",
                  "id": 17
                },
                "streamRpcRate": {
                  "type": "float",
                  "id": 18
                },
                "timePerStreamUpdate": {
                  "type": "float",
                  "id": 19
                }
              }
            },
            "MultiplexedRequest": {
              "fields": {
                "connectionRequest": {
                  "type": "ConnectionRequest",
                  "id": 1
                },
                "request": {
                  "type": "Request",
                  "id": 2
                }
              }
            },
            "MultiplexedResponse": {
              "fields": {
                "response": {
                  "type": "Response",
                  "id": 1
                },
                "streamUpdate": {
                  "type": "StreamUpdate",
                  "id": 2
                }
              }
            }
          }
        }
      }
    }
  }
}

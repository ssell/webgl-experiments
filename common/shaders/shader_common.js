// Using the VS Code extension `glsl-literal` for GLSL syntax highlighting in glsl`...` strings.
const glsl = x => x;

const shader_common_vs = glsl`#version 300 es

    precision mediump float;

    uniform mat4 ModelMatrix;
    uniform mat4 ViewMatrix;
    uniform mat4 ProjectionMatrix;
    uniform vec4 FrameInfo;              // [Frame Number, Time Elapsed, Frame Delta, 0]
    
    in vec4 VertexPosition;
    in vec4 VertexColor;
    in vec3 VertexNormal;
    in vec2 VertexUV;
    
    vec4 transformPosition()
    {
        return (ProjectionMatrix * ViewMatrix * ModelMatrix) * VertexPosition;
    }
`;

const shader_common_vs_instanced = glsl`#version 300 es

    precision mediump float;

    uniform mat4 ViewMatrix;
    uniform mat4 ProjectionMatrix;
    uniform vec4 FrameInfo;

    in mat4 ModelMatrix;
    in vec4 VertexPosition;
    in vec4 VertexColor;
    in vec3 VertexNormal;
    in vec2 VertexUV;

    vec4 transformPosition()
    {
        return (ProjectionMatrix * ViewMatrix * ModelMatrix) * VertexPosition;
    }
`;

const shader_common_fs = glsl`#version 300 es

    precision mediump float;

    // [Frame Number, Time Elapsed, Frame Delta, 0]
    uniform vec4 FrameInfo;

    uniform sampler2D sampler0;
    uniform sampler2D sampler1;
    uniform sampler2D sampler2;
    uniform sampler2D sampler3;

    out vec4 fragColor;
`;

const shader_common_fs_instanced = glsl`#version 300 es

    precision mediump float;
    
    // [Frame Number, Time Elapsed, Frame Delta, 0]
    uniform vec4 FrameInfo; 

    uniform sampler2D sampler0;
    uniform sampler2D sampler1;
    uniform sampler2D sampler2;
    uniform sampler2D sampler3;

    out vec4 fragColor;
`;
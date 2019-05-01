/**
 * Individual record of an overridable material property.
 * 
 * If a material is instanced then this property is an `attribute`,
 * otherwise it is a `uniform`. The `default` value is used only
 * if the currently rendered SceneObject does not provide a valid
 * override value in it's `materialProps` member. 
 */
class MaterialPropertyRecord
{
    constructor(context, name, defaultValue, size, location)
    {
        this.name     = name;
        this.default  = defaultValue;
        this.size     = size;
        this.location = location;
        this.buffer   = context.gl.createBuffer();
    }
}

/**
 * A material handles the mapping of a shader with user defined input.
 * There are two classes of input: Uniforms and Properties.
 * 
 * Uniforms, regardless of the material type, are values that are constant
 * for the entire binding of the material. They are represented in the GLSL
 * shader by the `uniform` type.
 * 
 * Properties may either resolve to a GLSL `uniform` or to an `attribute`
 * depending on the material type. If a material is instanced, then properties
 * are expected to be represented in the GLSL by an `attribute`. If the material
 * is not instanced then it is expected to be a `uniform`.
 * 
 * A property must first be enabled on the material, via `enableProperty`. The
 * value of the property passed to the bound shader will then be based on whether
 * a matching property value is set in the SceneObject's MaterialPropertyBlock 
 * member (`materialProps`). If a match is found, then that value is used.
 * Otherwise the default value specified in the `enableProperty` call is used.
 * 
 * Materials also handle the binding of the common shader variables:
 * 
 *     - ViewMatrix (Uniform)
 *     - ProjectionMatrix (Uniform)
 *     - ModelMatrix (Uniform or Attribute depending on if the material is instanced)
 *     - VertexPosition (Attribute)
 *     - VertexColor (Attribute)
 *     - VertexNormal (Attribute)
 *     - VertexUV (Attribute)
 */
class Material
{
    constructor(renderer, materialName, shaderName, instanced = false)
    {
        this.renderer   = renderer;
        this.name       = materialName;
        this.shader     = renderer.shaders.get(shaderName);
        this.instanced  = instanced;
        this.uniforms   = new Map();
        this.references = 0;
        this.properties = [];

        this.enableProperty("ModelMatrix", 16, mat4.create());
    }

    /**
     * Enables the binding of the specified property for the material.
     * 
     * If the material is instanced then the property must match with an `attribute` in the shader.
     * Otherwise, the property must match with a `uniform` in the shader.
     * 
     * If there is no match in the shader, then the property is not used.  Otherwise, there is a match 
     * in the shader, but not in the rendered SceneObject's `materialProps` then the default value provided is used.
     * 
     * @param {*} name Name of the property which must have a match in the underlying shader.
     * @param {*} size Size of the property, in bytes.
     * @param {*} defaultValue Default value of the property if not overriden by the SceneObject.
     */
    enableProperty(name, size, defaultValue)
    {
        if(this.properties.indexOf(name) != -1)
        {
            return;
        }

        let location = -1;

        if(this.instanced === false)
        {
            location = this.renderer.context.gl.getUniformLocation(this.shader.shaderProgram, name);
        }
        else
        {
            location = this.renderer.context.gl.getAttribLocation(this.shader.shaderProgram, name);
        }

        this.properties.push(new MaterialPropertyRecord(this.renderer.context, name, defaultValue, size, location));
    }

    /**
     * Disables the binding of the specified property.
     * @param {*} name 
     */
    disableProperty(name)
    {
        let index = this.properties.indexOf(name);

        if(index != -1)
        {
            this.properties.splice(index, 1);
        }
    }

    /**
     * Sets the value of the specified `uniform float`.
     * 
     * @param {*} name 
     * @param {*} value 
     */
    setUniformFloat(name, value)
    {
        this.setUniform(name, value, 1, this.renderer.context.gl.FLOAT);
    }

    /**
     * Sets the value of the specified `uniform vec2`.
     * 
     * @param {*} name 
     * @param {*} value 
     */
    setUniformVec2(name, value)
    {
        this.setUniform(name, value, 2, this.renderer.context.gl.FLOAT);
    }

    /**
     * Sets the value of the specified `uniform vec3`.
     * 
     * @param {*} name 
     * @param {*} value 
     */
    setUniformVec3(name, value)
    {
        this.setUniform(name, value, 3, this.renderer.context.gl.FLOAT);
    }

    /**
     * Sets the value of the specified `uniform vec4`.
     * 
     * @param {*} name 
     * @param {*} value 
     */
    setUniformVec4(name, value)
    {
        this.setUniform(name, value, 4, this.renderer.context.gl.FLOAT);
    }

    /**
     * Sets the value of the specified `uniform mat4`.
     * 
     * @param {*} name 
     * @param {*} value 
     */
    setUniformMat4(name, value)
    {

    }

    /**
     * For internal use. Or you can use it if the pre-supplied `setUniform*` methods aren't cutting it.
     * 
     * @param {*} name 
     * @param {*} value 
     * @param {*} size 
     * @param {*} type 
     */
    setUniform(name, value, size, type)
    {
        if(this.uniforms.has(name))
        {
            this.uniforms.delete(name);
        }

        this.uniforms.set(name, new MaterialPropertyUniform(this.shader, name, value, type, size, this.renderer.context));
    }

    /**
     * Binds the underlying shader as the active shader, and then assigns the defined uniform and attribute properties.
     * This should be used only for non-instanced materials. For instanced rendering, use `bindInstanced`.
     * 
     * @param {*} context 
     * @param {*} sceneObject Individual SceneObject which will be rendered with this material.
     */
    bind(context, sceneObject)
    {
        if(this.shader == null)
        {
            console.error("Attempting to bind material with undefined shader");
            return false;
        }

        if(!this.shader.bind(this.renderer.context))
        {
            return false;
        }

        this.bindUniforms();
        this.bindNonInstancedProperties(sceneObject);

        return true;
    }

    /**
     * Binds the underlying shader as the active shader, and then assigns the defined uniform and attribute properties.
     * This should be used only for instanced materials. For non-instanced rendering, use `bind`.
     * 
     * This separation is due to the fact that in non-instanced rendering we simply bind the uniforms in this call
     * and return whether that operation was successful or not.
     * 
     * However for instanced rendering (this method) we are responsible for also updating the instaced data buffers
     * for our shader program.
     * 
     * @param {*} context 
     * @param {*} sceneObjects Array of SceneObjects that will be rendered with this material in this instance.
     */
    bindInstanced(context, sceneObjects)
    {
        if(this.shader == null)
        {
            console.error("Attempting to bind material with undefined shader");
            return false;
        }

        if(!this.shader.bind(this.renderer.context))
        {
            return false;
        }

        this.bindUniforms();

        // Naive approach first and then we will optimize...

        // Each property already has a glBuffer allocated for it.
        // So we need to go through each scene object and build up the data array for it.
        // Once through all scene objects we can fill the buffer data and then discard the data array.
        // Then finally we bind the property buffers.

        let propertyCount = this.properties.length;
        let propertyArrays = [];

        for(let i = 0; i < propertyCount; ++i)
        {
            propertyArrays.push([]);
        }

        // Build up the data arrays
        for(let i = 0; i < sceneObjects.length; ++i)
        {
            let values = sceneObjects[i].materialProps.fetchProperties(this.properties);

            for(let j = 0; j < propertyCount; ++j)
            {
                propertyArrays[j].push.apply(propertyArrays[j], values[j]);
            }
        }

        // Bind the data to the buffers
        for(let i = 0; i < propertyCount; ++i)
        {
            let property = this.properties[i];

            if(property.location == -1)
            {
                continue;
            }

            let float32Array = Float32Array.from(propertyArrays[i]);

            context.gl.bindBuffer(context.gl.ARRAY_BUFFER, property.buffer);
            context.gl.bufferData(context.gl.ARRAY_BUFFER, float32Array, context.gl.STATIC_DRAW);

            if(property.size == 16)
            {
                context.gl.vertexAttribPointer(property.location + 0, 4, context.gl.FLOAT, false, 64, 0);
                context.gl.vertexAttribPointer(property.location + 1, 4, context.gl.FLOAT, false, 64, 16);
                context.gl.vertexAttribPointer(property.location + 2, 4, context.gl.FLOAT, false, 64, 32);
                context.gl.vertexAttribPointer(property.location + 3, 4, context.gl.FLOAT, false, 64, 48);
                
                context.gl.enableVertexAttribArray(property.location + 0);
                context.gl.enableVertexAttribArray(property.location + 1);
                context.gl.enableVertexAttribArray(property.location + 2);
                context.gl.enableVertexAttribArray(property.location + 3);

                context.gl.vertexAttribDivisor(property.location + 0, 1);
                context.gl.vertexAttribDivisor(property.location + 1, 1);
                context.gl.vertexAttribDivisor(property.location + 2, 1);
                context.gl.vertexAttribDivisor(property.location + 3, 1);
            }
            else
            {
                context.gl.vertexAttribPointer(property.location, property.size, context.gl.FLOAT, false, 0, 0);
                context.gl.enableVertexAttribArray(property.location);
                context.gl.vertexAttribDivisor(property.location, 1);
            }
        }
    }

    /**
     * Binds the values for the GLSL `uniform` variables.
     * These are set via the `setUniform*` family of methods.
     */
    bindUniforms()
    {
        let uniformIter = this.uniforms.keys();
        let uniform = uniformIter.next();

        while(!uniform.done)
        {
            this.uniforms.get(uniform.value).bind();
            uniform = uniformIter.next();
        }
    }

    /**
     * Binds our properties for a non-instanced material - they are bound as `uniform`s.
     * 
     * @param {*} sceneObject 
     */
    bindNonInstancedProperties(sceneObject)
    {
        for(let i = 0; i < this.properties.length; ++i)
        {
            let record = this.properties[i];
            let value  = record.default;

            if(record.name === "ModelMatrix")
            {
                value = sceneObject.modelMatrix();
            }
            else if(sceneObject.materialProps.properties.has(record.name))
            {
                value = sceneObject.materialProps.properties.get(record.name).value;  
            }

            switch(record.size)
            {
                case 1:
                this.renderer.context.gl.uniform1fv(record.location, value);
                break;

                case 2:
                this.renderer.context.gl.uniform2fv(record.location, value);
                break;

                case 3:
                this.renderer.context.gl.uniform3fv(record.location, value);
                break;

                case 4:
                this.renderer.context.gl.uniform4fv(record.location, value);
                break;

                case 16:
                this.renderer.context.gl.uniformMatrix4fv(record.location, false, value);
                break;
            }
        }
    }
}

/**
 * Represents a single `uniform` property for the material.
 * 
 * Note that these will always be represented as a `uniform` 
 * in the underlying shader, unlike those set in `enableProperty`.
 */
class MaterialPropertyUniform
{
    constructor(shader, name, value, type, size, context)
    {
        this.context  = context;
        this.name     = name;
        this.value    = value;
        this.type     = type;
        this.size     = size;
        this.location = context.gl.getUniformLocation(shader.shaderProgram, this.name);
    }

    bind()
    {
        if(this.location == -1)
        {
            return;
        }
        
        switch(this.size)
        {
            case 1:
            this.context.gl.uniform1fv(this.location, this.value);
            break;

            case 2:
            this.context.gl.uniform2fv(this.location, this.value);
            break;

            case 3:
            this.context.gl.uniform3fv(this.location, this.value);
            break;

            case 4:
            this.context.gl.uniform4fv(this.location, this.value);
            break;
        }
    }
}

/**
 * Represent a single entry in a `MaterialPropertyBlock`.
 */
class MaterialPropertyBlockRecord
{
    constructor(name, value, size, type)
    {
        this.name  = name;
        this.value = value;
        this.size  = size;
        this.type  = type;
    }
}

/**
 * Used by a `SceneObject` to provide optional overrides to material properties.
 * 
 * This allows for per-object specification of a shader input value, regardless
 * of whether the object is being rendered individually or grouped in an instance.
 * 
 * Note: if a per-material property is desired instead, then the `Material.setUniform*`
 * family of methods should be used.
 */
class MaterialPropertyBlock
{
    constructor(sceneObject)
    {
        this.sceneObject = sceneObject;
        this.properties = new Map();
        this.dirty = true;
    }

    setPropertyFloat(name, value)
    {
        this.setProperty(name, value, 1, 0x1406);
    }

    setPropertyVec2(name, value)
    {
        this.setProperty(name, value, 2, 0x1406);
    }

    setPropertyVec3(name, value)
    {
        this.setProperty(name, value, 3, 0x1406);
    }

    setPropertyVec4(name, value)
    {
        this.setProperty(name, value, 4, 0x1406);
    }

    setPropertyMatrix4(name, value)
    {

    }

    setProperty(name, value, size, type)
    {
        if(this.properties.has(name))
        {
            this.properties.delete(name);
        }

        this.properties.set(name, new MaterialPropertyBlockRecord(name, value, size, type));
        this.dirty = true;
    }

    getPropertyValue(name, defaultValue)
    {
        if(name === "ModelMatrix")
        {
            return Array.from(this.sceneObject.modelMatrix());
        }

        let property = this.properties.get(name);

        if(property === undefined)
        {
            return defaultValue;
        }
        
        return property.value;
    }


    fetchProperties(propertyList)
    {
        let results = []

        for(let i = 0; i < propertyList.length; ++i)
        {
            let property = propertyList[i];
            let result = this.getPropertyValue(property.name, property.default);
            
            results.push(result);
        }

        return results;
    }
}
/**
 * Minimal wrapper around a Float32Array and manages the data within it.
 * 
 * All operations, except for `remove`, are O(1).
 * The `remove` operation is O(n).
 */
class PropertyBucket
{
    constructor(context, entrySize, entryCapacity)
    {
        this.entrySize     = entrySize;       // Number of floats in an individual entry
        this.entryCapacity = entryCapacity;   // Maximum number of entries that can be held in this bucket
        this.entryCount    = 0;               // Current number of entries held in this bucket
        this.entryData     = new Float32Array(entrySize * entryCapacity);
        this.dataBuffer    = context.gl.createBuffer();
        this.dirty         = true;
    }

    bind(context)
    {
        context.gl.bindBuffer(context.gl.ARRAY_BUFFER, this.dataBuffer);

        if(this.dirty === true)
        {
            context.gl.bufferData(context.gl.ARRAY_BUFFER, this.dataBuffer, context.gl.STATIC_DRAW);
            this.dirty = false;
        }
    }
    
    /**
     * Returns true if the bucket has room for more entries.
     */
    isOpen()
    {
        return (this.entryCount < this.entryCapacity);
    }

    /**
     * Sets the entry at the specified index.
     * 
     * NOTE: This does not perform any checks to ensure that the specified
     * entry index is valid. As the owning `MaterialBucketHolder` is responsible
     * for performing all sanity checks. This is to reduce conditionals.
     * 
     * @param {*} entryIndex 
     */
    set(entryIndex, value)
    {
        for(let i = 0; i < this.entrySize; ++i)
        {
            this.entryData[entryIndex + i] = value[i];
        }

        this.dirty = true;
    }

    /**
     * Returns the entry at the specified index.
     * 
     * NOTE: This does not perform any checks to ensure that the specified
     * entry index is valid. As the owning `MaterialBucketHolder` is responsible
     * for performing all sanity checks. This is to reduce conditionals.
     * 
     * @param {*} entryIndex 
     */
    get(entryIndex)
    {
        let result = [];

        for(let i = 0; i < this.entrySize; ++i)
        {
            result.push(this.entryData[entryIndex + i]);
        }
    }

    /**
     * Removes the specified entry from the bucket.
     * 
     * NOTE 1: The capacity of the bucket does not change, and the underlying
     * `entryData` array is not re-allocated.
     * 
     * NOTE 2: This does not perform any checks to ensure that the specified
     * entry index is valid. As the owning `MaterialBucketHolder` is responsible
     * for performing all sanity checks. This is to reduce conditionals.
     * 
     * @param {*} entryIndex 
     */
    remove(entryIndex)
    {
        let start = (entryIndex * this.entrySize);

        // Shift the entire contents to the left one entry
        for(let i = start; i < this.entryCapacity; ++i)
        {
            this.entryData[i - this.entrySize] = this.entryData[i];
        }

        this.dirty = true;
    }

    /**
     * Adds the value to the bucket at the next available location.
     * 
     * NOTE 1: The capacity of the bucket does not change, and the underlying
     * `entryData` array is not re-allocated.
     * 
     * NOTE 2: This does not perform any checks to ensure that there is an open space.
     * This is to reduce the number of conditionals that must be performed. Consider
     * a `MaterialBucketHolder` that contains 10 `PropertyBucket`s. The owning 
     * `MaterialBucketHolder` is responsible for ensuring all of its buckets are in
     * sync with each other and thus only has to check once for all 10 properties.
     * 
     * @param {*} value 
     */
    add(value)
    {
        // Set the value to the next open index
        set(this.entryCount++, value);
    }
}

class MaterialBucketHolder
{
    constructor(context, properties, maxEntriesPerBucket)
    {
        this.context = context;
        this.properties = properties;
        this.propertyBuckets = new Map();                 // [property name] = [ bucket0, bucket1, bucket2, ...]
        this.propertyBuckets = [];                        // [propertyBlock.bucketIndex][propertyBlock.bucketEntryIndex] = propertyBlock
        this.maxEntriesPerBucket = maxEntriesPerBucket;

        // Add the initial bucket
        this.addBucket();
    }

    bind()
    {

    }

    add(propertyBlock)
    {
        let bucketIndex = -1;
        let checkBuckets = this.propertyBuckets.get("ModelMatrix");

        // Find the first bucket with free space
        for(let i = 0; i < checkBuckets.length; ++i)
        {
            if(checkBuckets[i].isOpen())
            {
                bucketIndex = i;
                break;
            }
        }

        // All buckets are full so we need to add another
        if(bucketIndex == -1)
        {
            bucketIndex = checkBuckets.length;
            this.addBucket();
        }

        // Add the property values to the bucket
        for(let i = 0; i < this.properties.length; ++i)
        {
            let property = this.properties[i];
            let value = propertyBlock.getPropertyValue(property.name, property.default);
            let bucket = this.propertyBuckets.get(property.name)[bucketIndex];

            if(value.length != bucket.entrySize)
            {
                console.error("Mismatch in property block value length (" + value.length + ") for '" + property.name + "' and expected size (" + bucket.entrySize + ") in bucket");
                continue;
            }

            if(i === 0)
            {
                propertyBlock.bucketEntryIndex = bucket.entryCount;
            }

            bucket.add(value);
        }

        // Update the property block's local record of where it resides
        propertyBlock.dirty            = false;
        propertyBlock.bucketIndex      = bucketIndex;
        propertyBlock.bucketEntryIndex = this.propertyBlocks[bucketIndex].length;
        
        // Update the holder's record of where the property block resides
        this.propertyBlocks[propertyBlock.bucketIndex].push(propertyBlock);
    }

    addBucket()
    {
        // Create a new bucket for each property
        for(let i = 0; i < this.properties.length; ++i)
        {
            this.propertyBuckets.get(this.properties[i].name).push(new PropertyBucket(this.context, this.properties[i].size, this.maxEntriesPerBucket));
        }

        // Create a new array of property blocks for this bucket
        this.propertyBlocks.push([]);
    }

    remove(propertyBlock)
    {
        // Remove the property values from each affected bucket
        for(let i = 0; i < this.properties.length; ++i)
        {
            this.propertyBuckets.get(this.properties[i].name)[propertyBlock.bucketIndex].remove(propertyBlock.bucketEntryIndex);
        }

        // Remove the property block from the holder's record of where it resides
        this.propertyBlocks[propertyBlock.bucketIndex].splice(propertyBlock.bucketEntryIndex, 1);

        // Update property blocks that were shifted
        for(let i = propertyBlock.bucketEntryIndex; i < this.propertyBlocks[propertyBlock.bucketIndex].length; ++i)
        {
            this.propertyBlocks[propertyBlock.bucketIndex][i].bucketEntryIndex = i;
        }

        // Update the removed property block
        propertyBlock.bucketIndex      = -1;
        propertyBlock.bucketEntryIndex = -1;
    }

    update(propertyBlock)
    {
        if(propertyBlock.dirty === false)
        {
            return;
        }

        for(let i = 0; i < this.properties.length; ++i)
        {
            let value = propertyBlock.getPropertyValue(this.properties[i].name, this.properties[i].default);
            let bucket = this.propertyBuckets.get(this.properties[i].name)[propertyBlock.bucketIndex];

            bucket.set(propertyBlock.bucketEntryIndex, value);
        }

        propertyBlock.dirty = false;
    }
}

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
     * @param {*} size Size of the property, in elements (floats).
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

            switch(property.size)
            {
                case 1:    // float
                case 2:    // vec2
                case 3:    // vec3
                case 4:    // vec4
                    context.gl.vertexAttribPointer(property.location, property.size, context.gl.FLOAT, false, 0, 0);
                    context.gl.enableVertexAttribArray(property.location);
                    context.gl.vertexAttribDivisor(property.location, 1);
                    break;

                case 9:    // mat3
                    context.gl.vertexAttribPointer(property.location + 0, 4, context.gl.FLOAT, false, 36, 0);     // 3 columns, 12 bytes per column
                    context.gl.vertexAttribPointer(property.location + 1, 4, context.gl.FLOAT, false, 36, 12);
                    context.gl.vertexAttribPointer(property.location + 2, 4, context.gl.FLOAT, false, 36, 24);
                    
                    context.gl.enableVertexAttribArray(property.location + 0);
                    context.gl.enableVertexAttribArray(property.location + 1);
                    context.gl.enableVertexAttribArray(property.location + 2);

                    context.gl.vertexAttribDivisor(property.location + 0, 1);
                    context.gl.vertexAttribDivisor(property.location + 1, 1);
                    context.gl.vertexAttribDivisor(property.location + 2, 1);
                    break;

                case 16:   // mat4
                    context.gl.vertexAttribPointer(property.location + 0, 4, context.gl.FLOAT, false, 64, 0);     // 4 columns, 16 bytes per column
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
                    break;
            }
        }
    }

    /**
     * Cleans up actions done during `bindInstanced` so future materials are not affected.
     * 
     * @param {*} context 
     */
    unbindInstanced(context)
    {
        for(let i = 0; i < this.properties.length; ++i)
        {
            let property = this.properties[i];
            let propertyLocationCount = property.size / 4;

            for(let j = 0; j < propertyLocationCount; ++j)
            {
                context.gl.vertexAttribDivisor(property.location + j, 0);
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
                value = sceneObject.transform.modelMatrix;
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
        this.bucketIndex = -1;
        this.bucketEntryIndex = -1;
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
            return Array.from(this.sceneObject.transform.modelMatrix);
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
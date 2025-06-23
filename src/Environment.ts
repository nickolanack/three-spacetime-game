import * as THREE from 'three';

export class Environment {

    scene;
    skyUniforms;
    sun;
    light;

    constructor(scene) {

        this.scene = scene;
        this.skyUniforms = {
            topColor: { value: new THREE.Color(0x87ceeb) },    // Day sky
            bottomColor: { value: new THREE.Color(0xfdf6e3) }, // Day horizon
        };

    }



    addSky() {


        const skyMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: this.skyUniforms,
            vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
            fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          varying vec3 vWorldPosition;
    
          void main() {
            float h = normalize(vWorldPosition).y;
            vec3 color = mix(bottomColor, topColor, max(h, 0.0));
            gl_FragColor = vec4(color, 1.0);
          }
        `,
            depthWrite: false,
        });

        const sky = new THREE.Mesh(
            new THREE.SphereGeometry(500, 32, 15),
            skyMat
        );
        this.scene.add(sky);
    }


    addSun() {

        this.sun = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sun.position.set(100, 200, 100);
        this.scene.add(this.sun);
    }


    render() {
        this.addSky();
        this.addSun();


        this.light = new THREE.HemisphereLight(0xffffff, 0x777777);
        this.light.position.set(0, 200, 0);
        this.scene.add(this.light);
        this.scene.add(this.light.clone());
    }


    animate(clock) {

        const time = clock.getElapsedTime();
        const t = (Math.sin(time * 0.01) + 1) / 2; // oscillates between 0 and 1

        // Define day/night colors
        const dayTop = new THREE.Color(0x87ceeb);    // Sky blue
        const nightTop = new THREE.Color(0x00001a);  // Midnight blue
        const dayBottom = new THREE.Color(0xfdf6e3); // Warm horizon
        const nightBottom = new THREE.Color(0x000000); // Ground

        // Interpolate sky colors
        this.skyUniforms.topColor.value.lerpColors(nightTop, dayTop, t);
        this.skyUniforms.bottomColor.value.lerpColors(nightBottom, dayBottom, t);

        // Interpolate sun light color and intensity
        this.sun.intensity = THREE.MathUtils.lerp(0.2, 1.0, t);
        this.sun.color.lerpColors(new THREE.Color(0x444488), new THREE.Color(0xffffff), t);

        this.light.color.lerpColors(nightTop, dayTop, t);
        this.light.groundColor.lerpColors(nightBottom, dayBottom, t);


        const dayFog = new THREE.Color(0xfdf6e3);    // Warm fog for day
        const nightFog = new THREE.Color(0x000000);  // Dark fog for night

        // Interpolate fog color

        this.scene.fog.color.copy(this.skyUniforms.bottomColor.value);

    }



}
# Fundamentos matemáticos

## La misma partición, tres interpretaciones

Se aproxima ∫∫D f dA mediante Σ f(xᵢ,yⱼ) ΔAᵢⱼ, usando puntos medios.
La integral firmada admite valores negativos. Su unidad es [f]·u².
El modelo sólido exige f≥0: f es altura en u, el volumen se expresa en u³.
La lámina está en z=0 y usa f=ρ≥0, densidad superficial en uₘ/u²:
su integral es masa en uₘ. u y uₘ son unidades elegidas por el usuario;
no hay conversión automática de unidades ni densidad volumétrica variable.

## Regiones y jacobiano

En un rectángulo, ΔA=ΔxΔy. En Tipo I, a≤x≤b y g₁(x)≤y≤g₂(x),
se toma Δyᵢ=(g₂(xᵢ)−g₁(xᵢ))/n. En Tipo II se intercambian x e y.
Las bases rectangulares pueden sobresalir de un borde curvo; el cálculo usa sus muestras.

En polares x=r cosθ, y=r sinθ. El determinante del cambio de variables es r:
dA=r dr dθ. Cada celda aporta f(rᵢ cosθⱼ,rᵢ sinθⱼ) rᵢΔrΔθ.
Si se introduce la función en r,θ, se usa esa misma fórmula sin convertir su expresión.
El usuario no debe incluir el jacobiano en la función. Los límites radiales son constantes.

## Centroide de un sólido uniforme

Para 0≤z≤f(x,y), integrar primero respecto de z da:

- V=∫∫D f dA.
- ∫∫∫S x dV=∫∫D xf dA; análogamente para y.
- ∫₀ᶠ z dz=f²/2, por lo que z̄=(∫∫D f²/2 dA)/V.
- x̄=(∫∫D xf dA)/V e ȳ=(∫∫D yf dA)/V, todas en u.

La densidad volumétrica uniforme se cancela en estos cocientes. Una caja de
base [0,2]×[0,3] y altura 2 tiene V=12 y centroide (1,1.5,1).
No se calcula masa sólida porque no se solicita una densidad volumétrica.

## Lámina con densidad

M=∫∫Dρ dA, x̄=(∫∫D xρ dA)/M, ȳ=(∫∫D yρ dA)/M y z̄=0.
Las inercias respecto de los ejes coordenados, no de ejes trasladados al centroide, son:
Ix=∫∫D y²ρ dA, Iy=∫∫D x²ρ dA e IO=Ix+Iy. Su unidad es uₘ·u².
Cada integral se evalúa con las mismas muestras y áreas. Se usa suma compensada.
Si el total muestreado es cero, los cocientes no están definidos; no se inventa un centroide.

## Seis casos del plan

1. **Inclinado:** ∫₀²∫₀¹(x+y)dy dx=∫₀²(x+1/2)dx=3.
2. **Paraboloide:** ∫₀²π∫₀²r²·r dr dθ=2π·(2⁴/4)=8π.
3. **Hemisferio:** ∫₀²π∫₀¹√(1−r²)r dr dθ=2π/3. La derivada radial diverge en r=1.
4. **Entre curvas:** ∫₀¹(x−x²)dx=1/6. También ∫₀¹(√y−y)dy=1/6.
5. **Semicírculo uniforme superior:** M=π/2 con ρ=1. Por simetría x̄=0.
   El momento ∫₀π∫₀¹r sinθ·r dr dθ=(1/3)·2=2/3, por tanto ȳ=4/(3π).
6. **Disco unitario de masa M:** ρ=M/π. IO=∫₀²π∫₀¹r²(M/π)r dr dθ=M/2.
   Por simetría Ix=Iy=M/4. El preset toma M=1; cambiar ρ escala masa e inercias.

## Qué significa converger

La tabla compara n=4,8,16,32,64. Con referencia exacta, Eₙ=|I−Iₙ| y
p=log₂(Eₙ/₂/Eₙ). Sin referencia sólo se muestra |Iₙ−Iₙ/₂| como indicador.
Para funciones suaves se espera orden cercano a dos; singularidades de frontera,
redondeo y límites variables pueden alterarlo. En física, esa tabla sigue el volumen
o la masa; la tabla física muestra por separado los errores de centroides e inercias.
No se certifican positividad ni integrabilidad entre muestras.

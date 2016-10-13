# Method

{>> TODO: references <<}
{>> TODO: follow ISO13790 symbol conventions<<}

## Introduction

## Physical model of building thermals and energy demand

Contents
- measurement theory  what variables am i using
- Theory of SPDM - building physics piecewise model.
- reiterate results from lit review but in cleaned and condensed form, having chosen state of the art results for each relevant section
- iterate over each topic (conduction, radiation, wind, rain...)
- limitations, assumptions, deliberate omissions (these are basically either limitations or assumptions)
- properties of the model

Structure
Introduction to measurement concepts
Thermal transfer mechanism grouped by theme with intro, content, discussion for each and overall
- conduction
- radiation
- air exchange


## Simplified Physical Demand Model (SPDM)


The Simplified Physical Demand Model (SPDM) is a steady-state lumped parameter building energy demand model which focuses on demand driven by heating requirements, themselves a function of thermal losses. It notably aims to distinguish between energy flows driven by thermodynamic processes and energy demand resulting from those flows, in accordance to the theory of measurement. Since only supplied energy can be directly measured, indirect inferences must be made about the energy loss process which are governed by the buildings' physical properties.


The aim of the SPDM is to combine a simplified thermal model of a dwelling with a set of functions linking thermal transfer processes to energy demand. This two-part approach aims to make explicit the assumptions made when translating from building thermals to metered demand and ensure a robust inference process from measurement to inferred values. {>> TODO: not to sure exactly what I'm trying to say here. Generally aiming the emphasize that we need two models, a thermal model and a thermal -> measurement model <<}.

The thermal model calculates a total heat flow rate $\Phi_{tot}$ in W as the sum of contributions to heat flow in/out of the dwelling $\Phi_{i}$:

$$
\Phi_{tot} = \sum_i^n \Phi_i
$$

Following the energy flow sign convention, heat losses from inside the building to the outside are negative, while heat gains are positive.

The metered demand $P_{tot}$ in W is some function of $\Phi_{tot}$:

$$
P_{tot} = f(\Phi_{tot})
$$

Note the implicit simplifying assumption that this is true *function* i.e. a one-to-on mapping. This assumption is necessary in order for inference from energy data to be possible - if one value of $\Phi_{tot}$ could correspond to a many different values of $P_{tot}$ it would be difficult (if not impossible) to make any inferences about the model parameters from energy demand ($P_{tot}$) measurements.

{>> Not sure about the above bit. Probably more confusing than enlightening. Also probably not true, think that there are some techniques that wouldn't depend on one-one mapping like probabilistic models.<<}


{>> TODO: section showing the general dependence of power on weather variables. Plots showing power-temperature dependence (basic PTG idea). Possibly some spline regression which demonstrate the general form of relations. Could also use 3D plots to show power/temperature/weather with spline or MARS regression fit surface. Idea is to show that the building physics theory presented at least corresponds to a first approximation (i.e. before doing the extensive validation of the next chapters) with the data
 <<}

The following sections will cover the building physics theory used to form the simplified thermal model and the heat loss to power demand link functions.


### Conduction

{>> Define HLC <<}

{>> TODO internal temperature model. This is pretty much bespoke I think because most papers assume you have measured internal temperatures or assume uncorrelated internal <<}

- The conductive loss model used in this research is greatly simplified.
- lump the heat loss of elements into a whole building heat loss rate
- use a quasi steady state to simplify again
- Previous grey-box models such as PRISM [@Fels1986] have ignored these terms and made the simplifying assumption that the outer surface temperature of the dwelling is equal to the ambient air temperature. Similarly, SAP/BREDEM only consider element U-values and external temperatures when estimating heat loss rates and do not model material surface properties [@SAP2009; @BRE2014]. Heat transfer through the building fabric is therefore modelled as a purely conductive process.
- see also co-heating [@Bauwens2014]



Following the ISO 13790 we define the transmission heat loss coefficient $H_{tr}$ in terms of the internal and external temperatures $T_{in}, T_{e}$ and the transmission heat loss rate $\Phi_{tr}$ [@eq:h_tr_iso].

{>>
  TODO expand discussion - talk about lumped htr parameter, what it includes (at this place...)
<<}

{>> TODO check signs, order of in, ex <<}

$$
\Phi_{tr} = H_{tr}(T_{in} - T_{ex})
$${#eq:conduction_linear}

{>> NOTE: need to consider the role of T_i, especially considering that it seems we can't actually model it as constant. Perhaps this belongs best in the Deconstruct section <<}



#### Covariance of internal and external temperature



{>> TODO decide whether to include the heat up period <<}

$$
T_{in} = \begin{cases}
T_{on} &\to t \in t_{ons}\\
T_{sc} + (T_{on} - T_{sc}) e^{-t / \tau} &\to t \in t_{offs}
\end{cases}
$$

The mean 24hr temperature $\overline{T_{in}}$ is (with time measured in hours)

$$
\overline{T_{in}} = 1/24 \sum_j \Delta t_j \overline{T_j}
$$

where for each segment j of the heating profile, $\Delta t_j$ is the duration of the segment and $\overline{T_j}$ is the mean temperature in that segment.

The mean temperature when heating is on is simply $T_{on}$ - this should ideally be the set-point, but for a whole dwelling average may be somewhat different.

We can calculate the mean temperature during a given cool off period, defining a time $t$ such that the start of the cool-down period is at 0 and the end of the time period is the time  the heating comes on again $t_{on}$. This can be generalised to arbitrary off and on times, but using these limits simplifies the exercise.

$$
\begin{align}
\overline{T_{in, cool}} &= \frac{1}{t_{on}} \int_0^{t_{on}} T_{sc} + (T_{on} - T_{sc}) e^{-t / \tau} dt\\
&= \frac{1}{t_{on}} \left[ T_{sc}t - \tau (T_{on} - T_{sc}) e^{-t / \tau} \right]_0^{t_{on}}\\
&= \frac{1}{t_{on}} (\left[ T_{sc}t_{on} - \tau (T_{on} - T_{sc}) e^{-t_{on} / \tau} \right] - \left[ T_{sc} 0 - \tau (T_{on} - T_{sc}) e^{0 / \tau} \right])\\
&= \frac{1}{t_{on}} (\left[ T_{sc}t_{on} - \tau (T_{on} - T_{sc}) e^{-t_{on} / \tau} \right] + \tau (T_{on} - T_{sc}))\\
&= T_{sc} + \frac{\tau}{t_{on}} (T_{on} - T_{sc}) \left( 1 - e^{-t_{on} / \tau} \right)
\end{align}
$$

As one might expect, the mean temperature in the cooldown period is the limit temperature $T_{sc}$ plus a factor that depends on the difference between the heating and the limit temperature and the time passed relative to the building's time constant.

The mean temperature over one day is then the sum of the means for different parts of the cycle.

$$
\overline{T_{in}} =\frac{1}{24} ( \sum_j \Delta t_j T_{on} +
  \sum_k \Delta t_k ( T_{sc} + \frac{\tau}{t_{k}} (T_{on} - T_{sc}) ( 1 - e^{-t_{k} / \tau} ))
$$


We are interested in developing a model for $T_{in}$ as a function of $T_{ex}$. The first step is to determine how $T_{in}$ changes as a function of $T_{ex}$ i.e. the first derivative of the mean.

The terms in the heating periods drop out immediately since they are constant, the derivative of the mean during cooldown period of duration $t_k$ is as follows


$$
\begin{align}
\frac{d\overline{T_{in, cool}}}{dT_{ex}} &= \frac{d}{dT_{ex}} \left( T_{sc} + \frac{\tau}{t_{k}} (T_{on} - T_{sc}) ( 1 - e^{-t_{k} / \tau} \right)\\
 &= \frac{d}{dT_{ex}} T_{sc} + \frac{\tau}{t_{k}} \frac{d}{dT_{ex}}(T_{on} - T_{sc}) ( 1 - e^{-t_{k} / \tau})\\
&= \frac{d}{dT_{ex}} T_{sc} + \frac{\tau}{t_{k}} \frac{d}{dT_{ex}}T_{on}( 1 - e^{-t_{k} / \tau}) - \frac{\tau}{t_{k}}\frac{d}{dT_{ex}}T_{sc}( 1 - e^{-t_{k} / \tau})\\
\frac{dT_{on}}{dT_{ex}}& = 0\\
&= \frac{dT_{sc}}{dT_{ex}}  - \frac{\tau}{t_{k}}\frac{dT_{sc}}{dT_{ex}}( 1 - e^{-t_{k} / \tau})

 \end{align}
$$

To summarise:

$$
\frac{d\overline{T_{in, cool}}}{dT_{ex}} = \frac{dT_{sc}}{dT_{ex}}(1 - \frac{\tau}{t_k} + \frac{\tau}{t_k}e^{-t_k/\tau})
$$

For a given heating pattern, for each cooldown period *k*, the term $(1 - \frac{\tau}{t_k} + \frac{\tau}{t_k}e^{-t_k/\tau})$ is constant since the duration of the cooldown period is set by the heating pattern and the time constant is a property of the building.

The derivative with respect to external temperature for a daily heating profile is then

$$
\frac{d\overline{T_{in}}}{dT_{ex}} =\frac{1}{24} (
  \sum_k \Delta t_k ( \frac{dT_{sc}}{dT_{ex}}(1 - \frac{\tau}{t_k} + \frac{\tau}{t_k}e^{-t_k/\tau}))
$$


The key term is $\frac{dT_{sc}}{dT_{ex}}$. A simple first order approximation for $T_{sc}$ can be obtained using a steady state heat balance with linearised losses:

$$
\phi_{gain} - \phi_{loss} = 0\\
H_{tr}(T_{sc} - T_{ex}) = \phi_{gain}\\
T_{sc} = T_{ex} + \phi_{gain} / H_{tr}
$$

The unsurprising result being that the steady state mean internal temperature without heating is the external temperature plus a factor that depends on other incidental gains (solar gains, appliances) and the heat loss coefficient. With this approximation, if we further assume that incidental gains do not depend on $T_{ex}$ then $\frac{dT_{sc}}{dT_{ex}} = 1$ and $\frac{d\overline{T_{in}}}{dT_{ex}}$ is


$$
\frac{d\overline{T_{in}}}{dT_{ex}} =\frac{1}{24} \left(
  \sum_k \Delta t_k (1 - \frac{\tau}{t_k} + \frac{\tau}{t_k}e^{-t_k/\tau}) \right)
$$s


{>> TODO Show sanity check because it's actually pretty nice that you get anything close to the expected result using a very very crude approximation <<}


We can test this assumption by performing covariance tests on internal temperatures.

{>> TODO  Plots showing the dependence of internal on external temperature – scatter plots with regressions and histograms of correlation coefficients. Note that it could be a bit confusing if you want to use the data selection algorithm from Deconstruct to do this regression but only present that algorigthm later. Need to figure out whether to put these intermediary results in the body of SPDM section or after <<}


### Radiative Gains


Consider the daily solar gains $\Phi_{sol}(t)$ where we for each surface of area $A_i$ we define $a_i$ as being the alpha value for an absorptive surface or the g-value for a transparent one:

$$
\Phi_{sol}(t) = \sum a_i A_{i} I_{i,tot}
$$

The mean power over time is

$$
P = \frac{1}{{t_2}-{t_1}} \int_{t_1}^{t_2} \Phi_{sol}(t) dt
$$

The energy absorbed over time is therefore a function of both the number and orientation of the sun-exposed surfaces of a dwelling and total (direct plus diffuse) irradiance reaching those surfaces over time.


The integral over time is then:

$$
\begin{align}
\Phi_{sol} &= \frac{1}{{t_2}-{t_1}} \int_{t_1}^{t_2} \sum a_i A_{i} I_{i,tot}(t) dt\\
&= \frac{1}{{t_2}-{t_1}} \sum a_i A_{i} \int_{t_1}^{t_2} I_{i,tot}(t) dt
 \end{align}
$$

which gives

$$
\Phi_{sol} = \sum a_i A_{i} \overline{I_{i,tot}}
$${#eq:method_sol_gain_element_sums}

where $\overline{I_{i,tot}}$ is the mean irradiance on surface *i* in a given period.

A linear approximation for solar gains is given by:

$$
\Phi_{sol} = A_{sol} I_{sol}
$${#eq:method_sol_linear}

where $A_{sol}$ in m2 is the effective solar aperture of the building and $I_{sol}$ is the received solar irradiance (W/m2).

The equivalence between [@eq:method_sol_gain_element_sums] and [@eq:method_sol_linear] can be thought of as finding an average $\overline{I_{i,tot}}$ over all *i* elements such that

$$
\begin{align}
\Phi_{sol} &= \sum a_i A_{i} \overline{I_{i,tot}} \\
  &= \overline{I_{sol}} \sum a_i A_{i}\\
  &= A_{sol} I_{sol}
\end{align}
$$

implying that

$$
A_{sol} = \sum a_i A_{i}
$$


{>> TODO previously kept the formulation as gA_sol i.e. having the mean g as well seperate. Not sure there's any point though because you can't separate it and the physical meaning is already a bit vague without making extra claims <<}

i.e. the building effective solar aperture is the sum of absorptivity/g-value of each element times the element area. Note that for this to work we need a 'reasonable' approximation of the mean irradiance on building surfaces.


### Longwave radiative losses


The fundamental equation of radiative heat loss for a building element *k*,

$$
Q_{sky, k} = \epsilon_{k} \sigma A_k F_{sky, k} (T_k^4 - T_{sky}^4)
$$

is of limited utility when the emissivity, areas, and view factors of a dwelling are not known. However if we make the simplifying assumption that the external surface of the dwelling is at the same emissive temperature $T_s$, we can simplify the total exchange:

$$
\begin{align}
Q_{sky} &= \sum Q_{sky, k}\\
 &= \sum \epsilon_{k} \sigma A_k F_{sky, k} (T_s^4 - T_{sky}^4)\\
 &= \sigma (T_s^4 - T_{sky}^4) \sum \epsilon_{k} A_k F_{sky, k} \\
 &= \sigma (T_s^4 - T_{sky}^4) C_{sky}
\end{align}
$$

where $C_{sky} = \sum \epsilon_{k} A_k F_{sky, k}$ is the longwave transmission coefficient representing building projected area times the emissivity. $C_{sky}$ could also be decomposed into $\epsilon$ and $\sum A_k F_{sky, k}$ if we make assumptions about the mean emissivity of the dwelling surface.

{>> TODO: will want some empirical work on this. Think about how you might actually estimate it. <<}

{>> TODO: think about using measured downwelling radiation instead of T_sky, since we actually have it as data. I think, but i need to check, that should be able to get Q_sky = Q_out - Q_in where Q_in is the downwelling and Q_out calculated from grey body emission <<}


### Air exchange


Energy is lost when air heated inside the building is exchanged with cold outside air. The energy loss is therefore a function of the heat content of the air:

$$
\Phi_{ve} = \dot{m} c_p (T_{in} - T_{ex})
$$

where $\dot{m}$ is the mass flow rate (kg/s),  $c_p$ is the heat capacity of air in J/kgK, 1005 J/kgK at standard temperature and pressure, $T_{in}$ and $T_{ex}$ are the internal and external temperatures. Equivalently in terms of the volumetric flow rate  $q_v$ in m^3^/s:

$$
  \Phi_{ve} = c_p\; \rho_{air}\; q_v (|T_{in} - T_{ex}|)
$${#eq:phi_ve_general}

where $\rho_{air}$ is the density of air, 1.205 kg/m3 at standard temperature and pressure. Note that the real air density will with temperature and atmospheric pressure.

The air flow is driven by pressure differences cause by the stack effect, wind, and mechanical ventilation.


#### Stack effect

The stack effect is the flow of air through a building resulting from a pressure differential created by the difference in temperature between internal and external air. When the interior is warmer than the exterior, warm air will tend to be expelled towards the top of the building and cool air drawn in towards the bottom.

The volumetric flow from the stack effect is modelled as a power law:

$$
q_{stack} = C(\Delta P)^n
$$

In the case where C is unknown (for example where there is no pressure test) we use the approximation of 0.6 [@Younes2012a]. For n we use the result that it should be ~0.67 from [@Walker1998].

∆P is modelled as a function of temperature difference and building height H (m):

$$
\Delta P_s = \rho_{out} g H \frac{|T_{in} - T_{ex}|}{T_{in}}
$$

where g is the gravitational constant and $\rho_{out}$ is the air density of outside air. Substituting into the volumetric flow rate power law gives:


$$
q_{stack} = C \left(\rho_{out} g H \frac{|T_{in} - T_{ex}|}{T_{in}}\right)^n
$$

Finally, substituting into the heat flow equation [@eq:phi_ve_general] gives:

$$
\begin{align}
  \Phi_{stack} &= c_p \rho_{air} C\left(\rho_{out} g H \frac{|T_{in} - T_{ex}|}{T_{in}}\right)^n  (|T_{in} - T_{ex}|)\\
            &= c_p \rho_{air} C(\rho_{out} g H)^n \frac{|T_{in} - T_{ex}|^n}{T_{in}^n}  (|T_{in} - T_{ex}|)\\
  \Phi_{stack} &= c_p \rho_{air} C(\rho_{out} g H)^n \frac{|T_{in} - T_{ex}|^{1+ n}}{T_{in}^n}
\end{align}
$$

For simplicity combine the constant (for one dwelling) term $C(\rho_{out} g H)^n$ into a stack effect response coefficient $C_{stack}$

$$
\Phi_{stack} = c_p \rho_{air} C_{stack} \frac{|T_{in} - T_{ex}|^{1+ n}}{T_{in}^n}
$$


{>>
  TODO: can c_p and rho be assumed to be constant in the interesting range (lets say -5 to 15˚C since it does look ok from wikipedia. much lower and it starts to looks like a significant difference) ? Find out their values...  If so can bundle up all the terms at the start $c_p \rho C(\rho_{out} g H)^n$ into one big constant
<<}

{>>
  Note for theoretical analysis: this equation is not that far off linear when you use n=0.67, more a kind of 'sag'. Might be that you can't cleanly merge with linear, but can do some numerical analysis to show whether you expect significant deviation from linear when you combine them. That feeds into the H_tr physical interpretation - probably H_tr is a combination of conduction and stack. At higher wind speeds will want to consider wind driven infiltration.
 <<}


#### Wind speed

{>> TODO possibly integrate Walker f parameter as a way to introduce direction dependance <<}

Wind causes pressure on building surfaces which drives air exchange. The wind pressure driving air infiltration is given by [@eq:simple-wind-pressure] [@Younes2012a]:

$$
\Delta P_{wind} = \frac{1}{2} \rho_{air} C_{wind} v^2
$${#eq:method-wind-pressure}

where $C_{wind}$ is the wind pressure coefficient. Substituting into the volumetric flow equation:

$$
q_{wind} = C(\frac{1}{2} \rho_{air} C_{pressure} v^2)^n
$$

Finally, substituting into the heat flow equation [@eq:phi_ve_general] gives:

$$
\begin{align}
  \Phi_{wind} &= c_p \rho_{air} q_{wind} (|T_{in} - T_{ex}|)\\
  &= c_p \rho C(\frac{1}{2} \rho_{air} C_{pressure} v^2)  (|T_{in} - T_{ex}|)\\
  \Phi_{wind} &= \frac{1}{2} c_p \rho_{air}^2 C  C_{pressure} v^2  (|T_{in} - T_{ex}|)
\end{align}
$$

{>> TODO: check with dimensional analysis that this actually makes sense... <<}

Showing that infiltration due to wind should vary with the square of the wind speed. The dimensionless flow rate coefficient $C$ and pressure coefficient $C_p$ can be lumped into a wind response coefficient $C_{wind}$. We maintain the other parameters as separate from this coefficient as we have reasonable constant values for air pressure and heat capacity.

$$  
\Phi_{wind} = \frac{1}{2} c_p \rho_{air}^2 C_{wind} v^2  (|T_{in} - T_{ex}|)
$$

It should be noted that in practice it may be a function of wind direction, since buildings may be more or less sheltered on different sides. On-site wind direction distributions are equally not expected to be uniform, since many regions have prevailing winds from a few distinct directions. A relatively complex dependence of energy on wind speed may therefore be expected.



#### Combining air exchange driven losses


We start by simply adding the terms for stack and wind driven infiltration losses (making the assumption that they are unrelated)

$$
\begin{align}
\Phi_{ve} &= \Phi_{stack} + \Phi_{wind}\\
 &= \frac{1}{2} c_p \rho_{air}^2 C_{wind} v^2  (|T_{in} - T_{ex}|) + c_p \rho_{air} C_{stack} \frac{|T_{in} - T_{ex}|^{1+ n}}{T_{in}^n}
 \end{align}
$$


{>> TODO maybe lump more into C_wind t make things neater in terms of constants <<}
$$
\Phi_{ve} = c_p \rho_{air}(|T_{in} - T_{ex}|)(\frac{1}{2} \rho_{air} C_{wind} v^2   + C_{stack} \frac{|T_{in} - T_{ex}|^{n}}{T_{in}^n})
$$

{>> TODO: Plots showing the dependence of power demand on wind speed – scatter plots with regressions (possibly loess) and histograms of correlation coefficients. Again as for temperature dependence, need to decide if these intermediate results should be mixed in with the theory or put in a separate section later. Advantage of having them here is that they can directly explain/inform decision wrt models
 <<}


### Baseload gains


Other loads in a dwelling such as appliances, lighting, and plug loads consume energy which is lost as heat into the dwelling envelope and affects the thermal balance. There is some debate as to what fraction of the baseload contributes to the building's thermal balance [@Everett1985b]. Introduce a parameter describing the fraction of baseload power that contributes to heating demand $\eta_b$. The thermal contribution of baseload is

$$
\Phi_{b} = \eta_b P_b
$${#eq:baseload_gains}

where $0 \leq \eta_b \leq 1$.

{>> TODO: put in general components term first instead of starting with expanded form <<}

We have seen from [@eq:total_power_general] that during the heating regime the total consumption is $|\Phi_{tot}| + P_b$. From [@eq:spcm_therm_parts], the total thermal flow is
$$
 \Phi_{tot} = H_{tr}(T_{e} - T_{i}) + gA_{sol} I_{sol} + c_p \rho A_{ve}v_{wind} (T_{e} - T_{i}) + \eta_b P_b
$$
Therefore the total demand will be:
$$
P_{tot} = |H_{tr}(T_{e} - T_{i}) + gA_{sol} I_{sol} + c_p \rho A_{ve}v_{wind} (T_{e} - T_{i}) + \eta_b P_b| + P_b
$$
It may seem surprising that the baseload power appears twice. For clarity, rewrite using thermal transfer contributions from conduction, solar gains, and ventilation $\Phi_{tr}$, $\Phi_{sol}$, $\Phi_{wind}$:
$$
\Phi_{tot} = \Phi_{tr} + \Phi_{sol} + \Phi_{wind} + \eta_b P_b
$$
For heating to be required, the total flow must be negative:
$$
\begin{aligned}
&\Phi_{tot} < 0\\
&\Phi_{tr} + \Phi_{sol} + \Phi_{wind} + \eta_b P_b < 0
 \end{aligned}
$$
To clarify the role of the baseload contribution to the thermal balance, understand that both $\eta_b P_b > 0$ and $\Phi_{sol} > 0$, therefore if $\Phi_{tot} < 0$ then $\Phi_{tr} + \Phi_{wind} > \Phi_{sol} + \eta_b P_b$, implying that $\eta_b P_b$ makes the losses 'less negative' and therefore its absolute value $|\Phi_{tot}|$ smaller. It also implies that

$$
\begin{aligned}
|\Phi_{tot}| &= |\Phi_{tr} + \Phi_{sol} + \Phi_{wind} + \eta_b P_b|\\
&= |\Phi_{tr}| + |\Phi_{wind}|+ \Phi_{sol} + \eta_b P_b
 \end{aligned}
$$
And therefore that
$$
P_{tot} = |\Phi_{tr}| + |\Phi_{wind}|+ \Phi_{sol} + (1 + \eta_b)P_b
$$
From this formula it appears we use $(1 + \eta_b)$ times the baseload power - as first glance this would violate the energy balance. In fact it does not, because we really do use the baseload power twice, for free, as illustrated in [@fig:baseload_power_contrib].

![Energy flow relation between thermal balance, heating demand, baseload power, and baseload power contribution to heating](../fig/baseload_power_contrib.png){#fig:baseload_power_contrib}

Effectively, the metered baseload demand is paid for once, for the purpose of driving various appliances. These appliances then re-emit energy as waste heat. Some appliances, such as ovens, or fridges, directly transform their energy consumption into heat. Others lose energy more indirectly, though from a purely thermodynamic perspective, all their energy must be conserved, therefore the only energy lost will be that which exits the envelope in some way, such as hot water draining from a washing machine. However, the relation to heating demand is more complex, because energy may be lost into the building envelope outside of heating demand periods, reducing its contribution to useful heating.





### Heating system efficiency

{>> REALLY IMPORTANT to be clear what impact heating has on the gradient, what we are actually estimating at the end. Will need some discussion WRT boiler efficiency (SEDBUK style) and 'effective efficiency' which is generally how much of the metered energy input ends up in the building <<}

{>> Make clear that heating efficiency will affect the gradient, and that this is a limitation <<}

{>> Gas boilers change their efficiency with external temperatures possibly - need to have some literature. will probably put it in lit review... <<}

Heating system efficiency in inverse modelling differs from boiler efficiency defined by manufacturers in the SEDBUK database. Standard boiler efficiency considers the transfer of energy from the fuel to hot water. However, heat losses from the boiler and heating system still enter the building envelope and are therefore not lost from the energy balance perspective.

Instead, two losses concern us:

1. Wasted metered fuel energy. Since energy is only measured as fuel consumption, if a fraction of this metered energy is wasted it undermines the assumption that energy consumed equals the heat supplied ([@eq:heating_total]). For electric heating this isn't a concern, but may be for gas. In particular, non-condensing boilers only extract the lower heating value (LHV) of the gas. Gas is monitored as volume with the energy contents calculated from the gas calorific value - this is generally taken as the higher heating value (HHV) [**REF**].
2. Energy lost from the heating system to the outside, such as the energy contents of hot flue gases.

These differences can be captured by a heating efficiency term $\eta$. The measured heating demand is:
$$
P'_{H} = \frac{P_H}{\eta}
$$
where $P_H$ is the heating power as calculated in [@eq:heating_total]. The measured heating power will be larger that the 'minimal' heating power resulting from the thermal balance.

Interestingly, the *lower* the boiler efficiency, the *higher* the apparent building efficiency when fitting for a given site. We can see this from the thermal loss coefficient $H_{tr}$ which is simply the gradient of power demand with respect to external temperature. Define $H'_{tr}$, the thermal efficiency estimated from $P'_H$ the heating power of a real system with efficiency $\eta < 1$.

$$
H'_{tr} = \frac{\partial P'_{H}}{\partial T_{ext}} = \frac{1}{\eta} \frac{\partial P_{H}}{\partial T_{ext}} = \frac{1}{\eta} H_{tr}
$$
$1/\eta > 1$, therefore $H'_{tr} > H_{tr}$: the apparent thermal loss coefficient measured will be high than the real one. Note that the axis intercepts and therefor the estimated internal temperature $T_{int}$ are not affected.

Unfortunately there is not enough data to infer heating system efficiency $\eta$ directly. Average values for heating systems could be used if the type of heating is known, but as stated above these efficiencies don't correspond to the efficiency measured by $\eta$. Further complicating the issue is many houses use a combination of central heating and secondary heating such as electric space heaters - estimating their combined efficiency is problematic. On the other hand, because waste heat is recaptured by the dwelling, the efficiencies should remain high. Condensing boilers have a high penetration in the UK minimizing the LHV/HHV issue.

{>> Tadj: Biddulph condensing boiler paper has info on this  <<}


### Non metered gains

An important confounding factor is unmetered energy gains. These include in particular metabolic gains (body heat from occupants) and the use of unmetered fuels such as wood and coal fireplaces.

Gains from occupants are relatively small - SAP gives typical gains of 60W per occupant [@SAP2009]. At a UK average of 2.3 people per household or 138W added when occupants are present, this is relatively small compared with heating and solar gains of several thousand watts.

More problematic are unmetered secondary heat sources, which could contribute significantly to the thermal balance. While the use of total energy consumption means that supplementary heating such as electric space heaters are included in the energy balance, other forms such as fireplaces (wood or coal) or paraffin burners are not. Without a more detailed housing survey it is simply not possible to estimate these gains. Their overall effect will be to make the building appear more efficient than it really is.


## Relating thermodynamics to measurement

The thermal processes drive power demand to maintain thermal comfort. Total power demand depends on which thermal processes are significant and how heating is delivered as a response to those processes. This means making further assumptions about a building's behavior.

Since we consider a steady state model, the energy balance equation must hold:
$$
Q_{in} - Q_{out} = 0
$$
A building requires heating if the net heat flow negative, i.e. heat is flowing out of the building. The heating power $P_{H}$ part of the total demand is:
$$
P_{H} =
  \begin{cases}
     |\Phi_{tot}| \text{ if } \Phi_{tot} < 0\\
     0 \text{  otherwise}
  \end{cases}
$${#eq:heating_total}

Total demand is the sum of heating power and baseload power:

$$
P_{tot} = P_{H} + P_b
$${#eq:total_demand}

Combining with [@eq:heating_total]:
$$
P_{tot} =
  \begin{cases}
     |\Phi_{tot}| + P_b \text{ if } \Phi_{tot} < 0\\
     P_b \text{ otherwise}
  \end{cases}
$${#eq:total_power_general}
sec:no_distinguish_stack].


## Limitations and assumptions

Not considered in the model:

- Weather dependance of appliances. We assume that appliances contribute to the base load and that their use doesn't really change through the year. {>> Tadj: but we know this isn't true e.g. lighting demand changes over the year. What you going to do about it? <<}
- Wind direction, because we just don't have it.
- a range of other physical processes that might affect demand, such as moisture exchange
- We only have a very simple model of water demand, bundled into baseload. If there is a consistent change wrt temperature, this will end up bundled into the power-temperature gradient.
- There's no physical model of thermal bridging, it's all bundled into the other parameters
- We assume that occupancy behaviour is *consistent*. That is, people are following some kind of operating pattern. If they aren't everything ends up in a massive noise term.


- The aim is that model residuals are not correlated with weather. This would imply that further variation in consumption can only be explained by introducing new explanatory variables
- Hopefully we explain *ENOUGH* of the variation to be useful


Assume that occupants will have an average presence over time. Since their heat input cannot be measured, we cannot account for them. We can however derive the dependence of total demand on metabolic gains

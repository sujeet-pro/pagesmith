---
title: Math & LaTeX
description: Inline and display math equations rendered with MathJax, supporting full LaTeX syntax.
---

# Math & LaTeX

Pagesmith supports mathematical notation through `remark-math` and `rehype-mathjax`. Write equations using standard LaTeX syntax and Pagesmith renders them to accessible SVG output. Use `$...$` for inline math and `$$...$$` for display math.

## Inline Math

Inline math flows naturally within text. The `$` delimiters must not have spaces immediately inside them.

The equation $E = mc^2$ describes mass-energy equivalence.

The sum of the first $n$ natural numbers is $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$.

A circle with radius $r$ has area $A = \pi r^2$ and circumference $C = 2\pi r$.

In probability, the expected value of a discrete random variable is $E[X] = \sum_{i} x_i \, p(x_i)$.

The Pythagorean theorem states that $a^2 + b^2 = c^2$ for a right triangle with legs $a$ and $b$ and hypotenuse $c$.

## Display Math

Display math is centered on its own line, which is useful for important equations or more complex expressions.

### Quadratic formula

The solutions to $ax^2 + bx + c = 0$ are given by:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

### Definite integral

The Gaussian integral is one of the most useful results in calculus and probability theory:

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

### Matrix notation

A 2x2 rotation matrix for angle $\theta$:

$$
R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}
$$

### Taylor series

The Taylor expansion of $e^x$ around $x = 0$:

$$
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots
$$

### Euler's identity

Often called the most beautiful equation in mathematics:

$$
e^{i\pi} + 1 = 0
$$

This connects five fundamental constants: $e$, $i$, $\pi$, $1$, and $0$.

### Bayes' theorem

The foundation of Bayesian inference:

$$
P(A \mid B) = \frac{P(B \mid A) \, P(A)}{P(B)}
$$

where $P(A \mid B)$ is the posterior probability, $P(B \mid A)$ is the likelihood, $P(A)$ is the prior, and $P(B)$ is the marginal likelihood.

## Mixing Text and Math

Mathematical expressions work naturally alongside prose, tables, links, and the rest of your Markdown content.

The **standard deviation** of a dataset is $\sigma = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(x_i - \mu)^2}$, where $\mu$ is the mean and $N$ is the number of observations.

Given a function $f(x) = x^3 - 6x^2 + 11x - 6$, we can find its roots by factoring:

$$
f(x) = (x - 1)(x - 2)(x - 3)
$$

so the roots are $x = 1$, $x = 2$, and $x = 3$.

### Big-O notation in context

Algorithm complexity is commonly expressed using Big-O notation. Binary search runs in $O(\log n)$ time, while a naive sort might take $O(n^2)$. Merge sort guarantees $O(n \log n)$ regardless of input.

| Algorithm     | Best case     | Average case  | Worst case    |
| ------------- | ------------- | ------------- | ------------- |
| Binary search | $O(1)$        | $O(\log n)$   | $O(\log n)$   |
| Quicksort     | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$      |
| Merge sort    | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ |

### Maxwell's equations

The four equations that describe classical electromagnetism:

$$
\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}
$$

$$
\nabla \cdot \mathbf{B} = 0
$$

$$
\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}
$$

$$
\nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
$$

These equations unify electricity, magnetism, and light into a single theoretical framework.

<script lang="ts">
    let {
        currentStep,
        totalSteps,
    } : {
        currentStep: number;
        totalSteps: number;
    } = $props();

    let progress = $derived((currentStep / totalSteps) * 100);
</script>

<div class="progress-bar-wrapper">
    <div class="progress-bar-container">
        <div class="progress-bar" style="width: {progress}%">
            <div class="progress-bar-shimmer"></div>
        </div>
    </div>
</div>

<style>
    .progress-bar-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .progress-bar-container {
        width: 100%;
        height: 2rem;
        background-color: var(--color-bg-light);
        border-radius: 0.5rem;
        overflow: hidden;
        position: relative;
    }

    .progress-bar {
        height: 100%;
        background-color: var(--color-primary);
        transition: width 0.3s ease;
        border-radius: 0.5rem;
        position: relative;
        overflow: hidden;
    }

    .progress-bar-shimmer {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
        );
        animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
        0% {
            left: -100%;
        }
        100% {
            left: 100%;
        }
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.6;
        }
    }
</style>

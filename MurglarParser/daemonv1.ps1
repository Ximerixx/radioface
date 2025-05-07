$appDataPath = [System.Environment]::GetFolderPath('ApplicationData')

$logFilePath = Join-Path -Path $appDataPath -ChildPath "Murglar\data\murglar.log"

$outputFilePath = Join-Path -Path (Get-Location) -ChildPath "nowplaying.txt"

# черная магия
#$trackPattern = 'Reporting TrackEnd\(.*\) for (.*?) - (.*?)\s*\(.*\)'
$trackPattern = '@\w+\s.{4}([^-]+)\s-\s([^(]+)\([^)]+track-\d+\)'


function Get-LastTrackFromFile {
    param (
        [string]$filePath
    )
    

    $lines = Get-Content -Path $filePath -Encoding UTF8
    $lastTrack = ""

    foreach ($line in $lines) {
        if ($line -match $trackPattern) {
            # Формат: "название трека - артист"
            $lastTrack = "$($matches[1]) - $($matches[2])"
        }
    }

    return $lastTrack
}


$lastTrack = Get-LastTrackFromFile -filePath $logFilePath


if (Test-Path $outputFilePath) {
    $previousTrack = Get-Content -Path $outputFilePath -Raw -Encoding UTF8
} else {
    $previousTrack = ""
}

Write-Host "Starting to monitor for new tracks..."

# Мониторим файл в реальном времени
Get-Content -Path $logFilePath -Wait -Encoding UTF8 | ForEach-Object {
    $line = $_
    #bebugling
	#Write-Host "New line: $line"
	
    if ($line -match $trackPattern) {
        # Формируем строку в формате "название трека - артист"
        $newTrack = "$($matches[1]) - $($matches[2])"
        
		Write-Host "New track detected: $newTrack"
		$newTrack | Out-File -FilePath $outputFilePath -Encoding UTF8
		$previousTrack = $newTrack
		
    }

}


#while ($true) {
#    try {
#        $stream = [System.IO.File]::Open($logFilePath, 'Open', 'Read', 'ReadWrite')
#        $stream.Close()
#    } catch {
#        Write-Host "file_Failed: $logFilePath"
#    }
#    Start-Sleep -Seconds 1
#}